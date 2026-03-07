# =============================================================
# app/services/ml_service.py  —  Enhanced ML Recommendation Engine
#
# Phase 7 upgrade:
#   • Loads feature-engineered models (13 crop features, 13 fert
#     features, 10 irrigation features)
#   • Per-crop and per-fertilizer rich advice + actionable tips
#   • NPK deficit analysis with specific correction advice
#   • Irrigation: water amount derived from ET0-calibrated classes
#   • Graceful degradation if any model file is missing
# =============================================================

import os
import logging
from typing import Optional, List, Tuple
from dataclasses import dataclass, field

import numpy as np
import joblib

from app.core.settings import settings

logger = logging.getLogger(__name__)


# ── Recommendation dataclasses ────────────────────────────────

@dataclass
class CropRecommendation:
    crop:           str
    confidence:     float
    top_3:          List[Tuple[str, float]]
    advice:         str
    growing_tips:   List[str]
    input_features: dict = field(default_factory=dict)


@dataclass
class FertilizerRecommendation:
    fertilizer:     str
    confidence:     float
    top_3:          List[Tuple[str, float]]
    advice:         str
    application:    str         # dose and timing
    npk_status:     dict        # N/P/K: low|optimal|high
    npk_corrections: List[str]  # specific correction advice
    input_features: dict = field(default_factory=dict)


@dataclass
class IrrigationRecommendation:
    action:          str        # no_irrigation|light_irrigation|heavy_irrigation
    confidence:      float
    advice:          str
    water_amount_mm: Optional[float]
    urgency:         str        # low|medium|high
    schedule:        str        # when to irrigate
    input_features:  dict = field(default_factory=dict)


# ── Knowledge base ────────────────────────────────────────────

CROP_ADVICE = {
    "rice":        ("Rice requires waterlogged fields (5–10 cm standing water).",
                    ["Transplant 25–30 day old seedlings",
                     "Maintain 2–5 cm water depth during tillering",
                     "Drain field 10 days before harvest"]),
    "maize":       ("Maize needs deep, well-drained fertile soil.",
                    ["Plant in rows 60–75 cm apart",
                     "Apply nitrogen in split doses at sowing and knee-height",
                     "Irrigate at silking stage — critical for yield"]),
    "wheat":       ("Wheat thrives in cool, dry conditions.",
                    ["Sow at 100–125 kg/ha seed rate",
                     "First irrigation at crown-root initiation (21 DAS)",
                     "Apply fungicide if rust symptoms appear"]),
    "chickpea":    ("Chickpea prefers dry winters and is drought-tolerant.",
                    ["Avoid waterlogging — use ridges if needed",
                     "Inoculate seeds with Rhizobium before sowing",
                     "One irrigation at pod filling is usually sufficient"]),
    "kidneybeans": ("Kidney beans need consistent moisture and warm nights.",
                    ["Sow after last frost; soil temp >18 °C",
                     "Avoid excess nitrogen — it reduces pod set",
                     "Watch for bean fly and pod borer"]),
    "pigeonpeas":  ("Pigeon peas are drought-tolerant, intercrop with cereals.",
                    ["Plant 1–2 seeds per hill at 75×40 cm spacing",
                     "Minimal irrigation after establishment",
                     "Harvest when 80% pods are dry"]),
    "mothbeans":   ("Moth beans are extremely drought-resistant legumes.",
                    ["Sow at start of monsoon in sandy soils",
                     "No irrigation typically needed",
                     "Best in arid and semi-arid zones"]),
    "mungbean":    ("Mung beans need warm temperatures and moderate moisture.",
                    ["Sow 20–25 kg/ha; germination in 4–5 days",
                     "Avoid standing water",
                     "Harvest in 2–3 pickings as pods mature"]),
    "blackgram":   ("Black gram thrives in warm, humid tropical conditions.",
                    ["Sow at start of rainy season",
                     "Treat seeds with Rhizobium + PSB",
                     "Keep field weed-free for first 30 days"]),
    "lentil":      ("Lentils prefer cool, dry conditions and light soils.",
                    ["Sow 40–60 kg/ha in November–December",
                     "One pre-sowing irrigation if soil is dry",
                     "Harvest when lower pods turn yellow"]),
    "cotton":      ("Cotton needs hot days, warm nights and moderate rainfall.",
                    ["Sow at 4–5 kg/ha delinted seed",
                     "Irrigate at squaring, flowering and boll formation stages",
                     "Monitor for bollworm and whitefly"]),
    "jute":        ("Jute thrives in warm, humid conditions with heavy rain.",
                    ["Sow broadcast at 7–8 kg/ha",
                     "Retting quality depends on clean, slow-moving water",
                     "Harvest before flowers open for best fibre"]),
    "pomegranate": ("Pomegranate is drought-tolerant once established.",
                    ["Plant at 5×5 m spacing",
                     "Drip irrigation at 8–10 L/tree/day in summer",
                     "Prune after harvest to encourage new fruiting branches"]),
    "banana":      ("Banana requires high moisture and warm temperatures year-round.",
                    ["Plant suckers 1.8×1.8 m apart",
                     "Irrigate every 3–4 days; avoid water stress",
                     "Bundle bunch with dry leaves to protect from sunburn"]),
    "mango":       ("Mango trees need a dry period before flowering.",
                    ["Withhold irrigation Oct–Nov to induce flowering",
                     "Apply micronutrient spray at pre-flowering stage",
                     "Harvest at physiological maturity — not full colour"]),
    "grapes":      ("Grapes need well-drained soil and low humidity at harvest.",
                    ["Train on bower/trellis system",
                     "Drip irrigate; avoid wetting foliage",
                     "Apply GA3 for berry size improvement"]),
    "watermelon":  ("Watermelons need warm soil and consistent moisture at fruiting.",
                    ["Mulch beds to conserve moisture",
                     "Pollination critical — keep bee-friendly environment",
                     "Reduce irrigation 7 days before harvest for sweetness"]),
    "muskmelon":   ("Muskmelons require warm conditions and light irrigation.",
                    ["Grow on raised beds with plastic mulch",
                     "Hand-pollinate in greenhouse conditions",
                     "Stop irrigation when netting appears on skin"]),
    "apple":       ("Apple needs chilling hours (<7 °C) for proper budbreak.",
                    ["Plant on rootstock suited to local soil",
                     "Prune in winter to open canopy",
                     "Spray lime sulphur for scab control"]),
    "orange":      ("Orange needs warm climate and moderate, regular water.",
                    ["Irrigate every 10–14 days; avoid water stress at flowering",
                     "Apply zinc sulphur spray if leaf yellowing observed",
                     "Harvest when TSS:acid ratio exceeds 10:1"]),
    "papaya":      ("Papaya grows fast and fruits within 9–12 months.",
                    ["Plant 2.5×2.5 m apart; hill planting recommended",
                     "Do not allow water logging — ensure drainage",
                     "Protect from papaya mosaic virus via aphid control"]),
    "coconut":     ("Coconut palms thrive in coastal humid climates.",
                    ["Irrigate basin method at 15-day intervals",
                     "Apply potassium-rich fertilizer for nut quality",
                     "Mulch with coconut husks around the basin"]),
    "coffee":      ("Coffee needs shade, humidity and well-drained acidic soil.",
                    ["Grow under shade trees (Grevillea or Silver Oak)",
                     "Irrigate 25–30 mm per week during dry spell",
                     "Strip-pick only ripe red cherries for quality"]),
}

FERTILIZER_ADVICE = {
    "Urea": {
        "advice": "Urea (46% N) is the primary nitrogen source. Use for nitrogen-deficient soils.",
        "application": "Apply 45–60 kg/ha. Split into 2–3 doses. Avoid surface broadcasting before rain.",
    },
    "DAP": {
        "advice": "DAP (18-46-0) supplies N and P at sowing. Ideal for phosphorus-deficient soils.",
        "application": "Apply 100–120 kg/ha at sowing. Place in furrows near seed, not in contact.",
    },
    "14-35-14": {
        "advice": "Balanced NPK for phosphorus-intensive crops. Good for transplanted vegetables.",
        "application": "Apply 150–200 kg/ha. Mix into soil before planting.",
    },
    "28-28": {
        "advice": "Equal N and P formula. Suitable for crops showing dual N+P deficiency.",
        "application": "Apply 100–125 kg/ha. Can be used as basal dose at sowing.",
    },
    "17-17-17": {
        "advice": "Fully balanced NPK. Best general-purpose fertilizer for mixed nutrient deficiency.",
        "application": "Apply 150 kg/ha. Split between basal and top dressing at tillering/branching.",
    },
    "20-20": {
        "advice": "N and P blend for pre-planting soil enrichment.",
        "application": "Apply 125–150 kg/ha. Incorporate into soil 10–14 days before planting.",
    },
    "10-26-26": {
        "advice": "High P and K formula. Excellent for root crops and fruiting crops.",
        "application": "Apply 200 kg/ha at planting. Enhances root development and fruiting.",
    },
}

IRRIGATION_INFO = {
    "no_irrigation": {
        "advice":   "Soil moisture is adequate. No irrigation required at this time.",
        "schedule": "Re-check soil moisture in 2–3 days.",
        "mm":       None,
        "urgency":  "low",
    },
    "light_irrigation": {
        "advice":   "Soil is mildly dry. Light irrigation will maintain optimal moisture.",
        "schedule": "Irrigate today or tomorrow in the early morning (5–7 AM) to minimise evaporation.",
        "mm":       18.0,
        "urgency":  "medium",
    },
    "heavy_irrigation": {
        "advice":   "Soil is critically dry. Immediate irrigation is required to prevent crop stress.",
        "schedule": "Irrigate immediately. Apply in two doses 4 hours apart to prevent runoff.",
        "mm":       38.0,
        "urgency":  "high",
    },
}


# ── ML Service ────────────────────────────────────────────────

class MLService:

    def __init__(self):
        self._crop_model      = None
        self._crop_le         = None
        self._crop_sc         = None
        self._crop_feats      = None

        self._fert_model      = None
        self._fert_le         = None
        self._fert_sc         = None
        self._soil_le         = None
        self._ctype_le        = None
        self._fert_feats      = None

        self._irrig_model     = None
        self._irrig_le        = None
        self._irrig_sc        = None
        self._irrig_crop_le   = None
        self._irrig_stage_le  = None
        self._irrig_feats     = None

        self._models_loaded   = False

    def _load(self, filename):
        path = os.path.join(settings.ML_MODELS_DIR, filename)
        if not os.path.exists(path):
            logger.warning(f"[ML] Missing model file: {filename}")
            return None
        obj = joblib.load(path)
        logger.info(f"[ML] Loaded: {filename}")
        return obj

    def load_all_models(self):
        logger.info("[ML] Loading enhanced recommendation models ...")

        self._crop_model  = self._load("crop_recommendation_model.joblib")
        self._crop_le     = self._load("crop_label_encoder.joblib")
        self._crop_sc     = self._load("crop_feature_scaler.joblib")
        self._crop_feats  = self._load("crop_feature_names.joblib")

        self._fert_model  = self._load("fertilizer_recommendation_model.joblib")
        self._fert_le     = self._load("fertilizer_label_encoder.joblib")
        self._fert_sc     = self._load("fertilizer_feature_scaler.joblib")
        self._soil_le     = self._load("soil_type_encoder.joblib")
        self._ctype_le    = self._load("crop_type_encoder.joblib")
        self._fert_feats  = self._load("fertilizer_feature_names.joblib")

        self._irrig_model    = self._load("irrigation_recommendation_model.joblib")
        self._irrig_le       = self._load("irrigation_label_encoder.joblib")
        self._irrig_sc       = self._load("irrigation_feature_scaler.joblib")
        self._irrig_crop_le  = self._load("irrig_crop_encoder.joblib")
        self._irrig_stage_le = self._load("irrig_stage_encoder.joblib")
        self._irrig_feats    = self._load("irrigation_feature_names.joblib")

        n = sum([self._crop_model is not None,
                 self._fert_model is not None,
                 self._irrig_model is not None])
        self._models_loaded = n > 0
        logger.info(f"[ML] {n}/3 models ready.")
        if n == 0:
            logger.warning("[ML] Run:  python ml/train_models.py  then restart.")

    def is_ready(self) -> bool:
        return self._models_loaded

    # ── Feature engineering (mirrors train_models.py) ─────────

    def _eng_crop(self, N, P, K, temp, hum, pH, rain) -> np.ndarray:
        npk   = N + P + K
        n2p   = N / (P + 1e-3)
        n2k   = N / (K + 1e-3)
        p2k   = P / (K + 1e-3)
        heat  = temp * (1 - hum / 200)
        water = rain * hum / 100
        return np.array([[N, P, K, temp, hum, pH, rain,
                          npk, n2p, n2k, p2k, heat, water]])

    def _eng_fert(self, temp, hum, mois, soil_enc, crop_enc,
                  N, K, P) -> np.ndarray:
        npk   = N + P + K
        n_def = max(0.0, 40 - N)
        p_def = max(0.0, 20 - P)
        k_def = max(0.0, 20 - K)
        mt    = mois * temp / 100
        return np.array([[temp, hum, mois, soil_enc, crop_enc,
                          N, K, P, npk, n_def, p_def, k_def, mt]])

    def _eng_irrig(self, sm, temp, hum, pH, rain,
                   crop_enc, stage_enc) -> np.ndarray:
        vpd    = (1 - hum / 100) * temp
        dry    = (100 - sm) * vpd / 50
        eff_r  = rain * 0.75
        return np.array([[sm, temp, hum, pH, rain,
                          crop_enc, stage_enc, vpd, dry, eff_r]])

    # ── NPK status analysis ────────────────────────────────────

    def _npk_analysis(self, N, P, K):
        def lvl(v, lo, hi):
            return "low" if v < lo else ("high" if v > hi else "optimal")
        status = {
            "nitrogen":   lvl(N,  40,  80),
            "phosphorus": lvl(P,  20,  60),
            "potassium":  lvl(K,  20,  80),
        }
        corrections = []
        if status["nitrogen"]   == "low":
            corrections.append(f"Nitrogen is low ({N:.0f} kg/ha). Apply Urea or DAP to increase N.")
        if status["phosphorus"] == "low":
            corrections.append(f"Phosphorus is low ({P:.0f} kg/ha). Apply DAP or SSP at 80–100 kg/ha.")
        if status["potassium"]  == "low":
            corrections.append(f"Potassium is low ({K:.0f} kg/ha). Apply MOP (Muriate of Potash) at 60 kg/ha.")
        if status["nitrogen"]   == "high":
            corrections.append("Nitrogen is high. Skip urea top-dressing to avoid lodging.")
        if not corrections:
            corrections.append("NPK levels are in the optimal range. Maintain current nutrient programme.")
        return status, corrections

    # ── Crop Recommendation ───────────────────────────────────

    def predict_crop(
        self,
        nitrogen:    float,
        phosphorus:  float,
        potassium:   float,
        temperature: float,
        humidity:    float,
        ph:          float,
        rainfall:    float,
    ) -> Optional[CropRecommendation]:

        if self._crop_model is None:
            logger.warning("[ML] Crop model not loaded.")
            return None
        try:
            X  = self._eng_crop(nitrogen, phosphorus, potassium,
                                 temperature, humidity, ph, rainfall)
            Xs = self._crop_sc.transform(X)

            probas  = self._crop_model.predict_proba(Xs)[0]
            top_idx = np.argsort(probas)[::-1][:3]
            top_3   = [(self._crop_le.classes_[i], round(float(probas[i]), 4))
                       for i in top_idx]
            crop, conf = top_3[0]

            info  = CROP_ADVICE.get(crop.lower(),
                    (f"Ensure good soil management for {crop}.", []))
            advice, tips = (info if isinstance(info, tuple)
                            else (info, [f"Follow standard agronomic practices for {crop}."]))

            return CropRecommendation(
                crop           = crop,
                confidence     = conf,
                top_3          = top_3,
                advice         = advice,
                growing_tips   = tips,
                input_features = {
                    "N": nitrogen, "P": phosphorus, "K": potassium,
                    "temperature": temperature, "humidity": humidity,
                    "pH": ph, "rainfall_mm": rainfall,
                }
            )
        except Exception as e:
            logger.error(f"[ML] Crop prediction error: {e}")
            return None

    # ── Fertilizer Recommendation ─────────────────────────────

    def predict_fertilizer(
        self,
        temperature: float,
        humidity:    float,
        moisture:    float,
        soil_type:   str,
        crop_type:   str,
        nitrogen:    float,
        potassium:   float,
        phosphorus:  float,
    ) -> Optional[FertilizerRecommendation]:

        if self._fert_model is None:
            logger.warning("[ML] Fertilizer model not loaded.")
            return None
        try:
            try:
                soil_enc = int(self._soil_le.transform([soil_type])[0])
            except ValueError:
                soil_enc = 0
            try:
                crop_enc = int(self._ctype_le.transform([crop_type])[0])
            except ValueError:
                crop_enc = 0

            X  = self._eng_fert(temperature, humidity, moisture,
                                 soil_enc, crop_enc,
                                 nitrogen, potassium, phosphorus)
            Xs = self._fert_sc.transform(X)

            probas  = self._fert_model.predict_proba(Xs)[0]
            top_idx = np.argsort(probas)[::-1][:3]
            top_3   = [(self._fert_le.classes_[i], round(float(probas[i]), 4))
                       for i in top_idx]
            fert, conf = top_3[0]

            info         = FERTILIZER_ADVICE.get(fert, {})
            npk_st, corr = self._npk_analysis(nitrogen, phosphorus, potassium)

            return FertilizerRecommendation(
                fertilizer      = fert,
                confidence      = conf,
                top_3           = top_3,
                advice          = info.get("advice", f"Apply {fert} as recommended."),
                application     = info.get("application", "Follow package instructions."),
                npk_status      = npk_st,
                npk_corrections = corr,
                input_features  = {
                    "temperature": temperature, "humidity": humidity,
                    "moisture": moisture, "soil_type": soil_type,
                    "crop_type": crop_type, "N": nitrogen,
                    "K": potassium, "P": phosphorus,
                }
            )
        except Exception as e:
            logger.error(f"[ML] Fertilizer prediction error: {e}")
            return None

    # ── Irrigation Recommendation ─────────────────────────────

    def predict_irrigation(
        self,
        soil_moisture: float,
        temperature:   float,
        humidity:      float,
        ph:            float,
        rainfall_mm:   float,
        crop_type:     str = "Wheat",
        growth_stage:  str = "mid_season",
    ) -> Optional[IrrigationRecommendation]:

        if self._irrig_model is None:
            logger.warning("[ML] Irrigation model not loaded.")
            return None
        try:
            crop_enc  = 0
            stage_enc = 2   # mid_season default
            if self._irrig_crop_le is not None:
                try:
                    crop_enc = int(self._irrig_crop_le.transform([crop_type])[0])
                except ValueError:
                    pass
            if self._irrig_stage_le is not None:
                try:
                    stage_enc = int(self._irrig_stage_le.transform([growth_stage])[0])
                except ValueError:
                    pass

            X  = self._eng_irrig(soil_moisture, temperature, humidity,
                                  ph, rainfall_mm, crop_enc, stage_enc)
            Xs = self._irrig_sc.transform(X)

            probas    = self._irrig_model.predict_proba(Xs)[0]
            pred_cls  = int(self._irrig_model.predict(Xs)[0])
            conf      = float(probas[pred_cls])

            CLASS_NAMES = ["no_irrigation", "light_irrigation", "heavy_irrigation"]
            action      = CLASS_NAMES[pred_cls]
            info        = IRRIGATION_INFO[action]

            return IrrigationRecommendation(
                action          = action,
                confidence      = conf,
                advice          = info["advice"],
                water_amount_mm = info["mm"],
                urgency         = info["urgency"],
                schedule        = info["schedule"],
                input_features  = {
                    "soil_moisture_pct": soil_moisture,
                    "temperature_c":     temperature,
                    "humidity_pct":      humidity,
                    "ph_value":          ph,
                    "rainfall_mm":       rainfall_mm,
                    "crop_type":         crop_type,
                    "growth_stage":      growth_stage,
                }
            )
        except Exception as e:
            logger.error(f"[ML] Irrigation prediction error: {e}")
            return None


# Single instance loaded at FastAPI startup
ml_service = MLService()
