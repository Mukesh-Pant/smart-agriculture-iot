# =============================================================
# app/services/ml_service.py — Phase 8 ML Inference Engine
#
# Loads and serves 4 advanced deep learning models:
#   1. SwiFT (PyTorch)      — Crop Recommendation
#   2. TTL (PyTorch)        — Irrigation Advice (5-class, crop-aware)
#   3. TabNet (pytorch-tabnet) — Soil Fertility (Low/Medium/High)
#   4. TabNet (pytorch-tabnet) — Fertilizer Recommendation
#
# XAI: LIME explanations for TabNet models (soil + fertilizer)
# =============================================================

import os
import sys
import logging
from typing import Optional
from dataclasses import dataclass, field

import numpy as np
import joblib
import torch

from app.core.settings import settings

# Add ml/ to path so models module is importable at runtime
_ML_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml")
if _ML_DIR not in sys.path:
    sys.path.insert(0, os.path.abspath(_ML_DIR))

logger = logging.getLogger(__name__)
DEVICE = torch.device("cpu")


# ── Recommendation Dataclasses ────────────────────────────────

@dataclass
class CropRecommendation:
    crop:           str
    confidence:     float
    top_3:          list
    advice:         str
    input_features: dict = field(default_factory=dict)


@dataclass
class FertilizerRecommendation:
    fertilizer:     str
    confidence:     float
    top_3:          list
    advice:         str
    npk_status:     dict = field(default_factory=dict)
    input_features: dict = field(default_factory=dict)
    explanation:    Optional[dict] = None


@dataclass
class IrrigationRecommendation:
    action:          str
    confidence:      float
    advice:          str
    water_amount_mm: Optional[float]
    urgency:         str
    crop_aware:      bool = False
    input_features:  dict = field(default_factory=dict)


@dataclass
class SoilFertilityResult:
    fertility_class: str
    confidence:      float
    class_probs:     dict
    advice:          str
    explanation:     Optional[dict] = None
    input_features:  dict = field(default_factory=dict)


# ── Advice Templates ──────────────────────────────────────────

CROP_ADVICE = {
    # Terai belt crops
    "rice":        "Rice thrives in waterlogged conditions. Transplant in June–July. Ensure 5–7 cm standing water during tillering.",
    "wheat":       "Wheat prefers cool temperatures (15–22°C). Sow in October–November. Timely irrigation at crown root initiation is critical.",
    "maize":       "Maize needs well-drained fertile soil. Plant in March or June. Avoid waterlogging at any stage.",
    "mustard":     "Mustard grows well in cool dry conditions. Sow in October–November. Requires minimal irrigation in Terai.",
    "jute":        "Jute thrives in warm humid Terai conditions. Needs heavy rainfall (1500–2000 mm). Sow in April–May.",
    "lentil":      "Lentils prefer cool dry weather. Sow in November. Drought-tolerant; one irrigating at pod-filling improves yield.",
    "chickpea":    "Chickpea needs dry conditions after sowing. Avoid excess moisture. Well-suited for Terai winter season.",
    "blackgram":   "Black gram grows best in warm humid Terai. Sow in June–July. Ensure good drainage to prevent root rot.",
    "mungbean":    "Mung beans need moderate water. Sow in March or June. Short-duration crop (60–65 days) suitable for Terai.",
    "pigeonpeas":  "Pigeon peas are drought-tolerant. Suitable for mid-hills and inner Terai. Sow in May–June.",
    "kidneybeans": "Kidney beans need consistent moisture. Grow in mid-hills (800–2000m). Monitor soil moisture at flowering.",
    "soybean":     "Soybean needs warm humid conditions. Sow in June–July in Terai. Fix atmospheric nitrogen; reduces fertilizer need.",
    "banana":      "Banana needs high moisture and warm temperatures. Ideal for Terai lowlands. Irrigate twice weekly in dry season.",
    "watermelon":  "Watermelon needs warm weather and consistent moisture at fruiting. Grow in sandy loam Terai soils.",
    # Mid-hills crops
    "potato":      "Potato grows best at 15–20°C in mid-hills. Plant in September–October or February. Well-drained loam soil essential.",
    "mango":       "Mango trees prefer warm dry conditions with a cool dry spell before flowering. Terai and lower mid-hills.",
    "apple":       "Apple requires chilling hours (<7°C). Best suited for mid-hills above 1500m (Mustang, Jumla). Well-drained soil.",
    "orange":      "Orange grows well in mid-hills (300–1500m). Requires regular watering and warm climate. Citrus-friendly pH 6–7.",
}

FERTILIZER_ADVICE = {
    "Urea":          "Apply Urea (46% N) for nitrogen deficiency. Use 45–60 kg/ha in split doses. Top-dress at tillering and panicle initiation.",
    "DAP":           "DAP (18-46-0) provides nitrogen and phosphorus. Apply at sowing time, 50–100 kg/ha. Ideal for phosphorus-deficient soils.",
    "MOP":           "MOP (Muriate of Potash, 60% K₂O) corrects potassium deficiency. Apply 40–60 kg/ha at sowing. Improves crop quality.",
    "NPK 20-20-20":  "Balanced NPK 20-20-20 for soils deficient in all macronutrients. Apply 100–150 kg/ha. Good for vegetables and fruits.",
    "Compost":       "Compost improves soil organic matter and microbial activity. Apply 5–10 tonnes/ha. Best for long-term soil health.",
}

IRRIGATION_ADVICE = [
    "Soil moisture is adequate. No irrigation needed.",
    "Moderate moisture deficit. Apply 10–15mm of water.",
    "Significant moisture deficit. Apply 20–25mm of water.",
    "Very dry conditions. Apply 30–35mm of water soon.",
    "Critical water stress. Apply 40–50mm of water IMMEDIATELY.",
]
IRRIGATION_WATER_MM = [None, 12.5, 22.5, 32.5, 45.0]
IRRIGATION_URGENCY  = ["low", "low", "medium", "high", "critical"]

SOIL_ADVICE = {
    "Low":    "Soil fertility is LOW. Apply organic manure and balanced NPK. Conduct soil health card test.",
    "Medium": "Soil fertility is MEDIUM. Maintain with regular organic additions and targeted fertilization.",
    "High":   "Soil fertility is HIGH. Excellent conditions for most crops. Monitor for nutrient imbalances.",
}

# FAO-56 crop coefficients for irrigation calculation (Nepal crops)
_CROP_KC = {
    "Wheat":1.15, "Rice":1.20, "Maize":1.20, "Potato":1.15,
    "Mustard":1.05, "Vegetables":1.05, "Fruits":0.90,
    "Pulses":1.05, "Soybean":1.10,
}
_STAGE_MOD = {
    "initial":0.80, "development":1.00, "mid_season":1.15, "late_season":0.85
}


# ── ML Service ────────────────────────────────────────────────

class MLService:
    """
    Phase 8 ML inference engine.
    Loads 4 advanced models at startup and exposes prediction + XAI methods.
    """

    def __init__(self):
        # SwiFT Crop (PyTorch)
        self._swift_model   = None
        self._swift_encoder = None
        self._swift_scaler  = None
        self._swift_feats   = None

        # TTL Irrigation (PyTorch)
        self._ttl_model     = None
        self._ttl_scaler    = None
        self._ttl_labels    = None
        self._ttl_num_feats = None
        self._ttl_crop_enc  = None
        self._ttl_stage_enc = None

        # TabNet Soil Fertility
        self._soil_model      = None
        self._soil_encoder    = None
        self._soil_scaler     = None
        self._soil_feats      = None
        self._soil_background = None

        # TabNet Fertilizer
        self._fert_model      = None
        self._fert_encoder    = None
        self._fert_scaler     = None
        self._fert_soil_enc   = None
        self._fert_crop_enc   = None
        self._fert_feats      = None
        self._fert_background = None

        self._models_loaded = False

    def _load(self, filename):
        path = os.path.join(settings.ML_MODELS_DIR, filename)
        if not os.path.exists(path):
            logger.warning(f"[ML] Not found: {path}")
            return None
        obj = joblib.load(path)
        logger.info(f"[ML] Loaded: {filename}")
        return obj

    def _load_torch(self, model_class, config_file, weights_file):
        """Reconstruct a PyTorch model from saved config dict + state_dict."""
        cfg     = self._load(config_file)
        weights = os.path.join(settings.ML_MODELS_DIR, weights_file)
        if cfg is None or not os.path.exists(weights):
            logger.warning(f"[ML] Missing: {config_file} or {weights_file}")
            return None
        model = model_class(**cfg)
        model.load_state_dict(torch.load(weights, map_location=DEVICE))
        model.eval()
        model.to(DEVICE)
        logger.info(f"[ML] Loaded PyTorch model: {weights_file}")
        return model

    def load_all_models(self):
        """Load all 4 Phase 8 models at FastAPI startup."""
        logger.info("[ML] Loading Phase 8 advanced models...")

        try:
            from models.swift_crop     import SwiFTCropModel
            from models.ttl_irrigation import TTLIrrigationModel
        except ImportError:
            try:
                from ml.models.swift_crop     import SwiFTCropModel
                from ml.models.ttl_irrigation import TTLIrrigationModel
            except ImportError as e:
                logger.error(f"[ML] Cannot import model classes: {e}")
                return

        try:
            from pytorch_tabnet.tab_model import TabNetClassifier
        except ImportError as e:
            logger.error(f"[ML] pytorch_tabnet not installed: {e}")
            return

        # 1. SwiFT Crop
        self._swift_model   = self._load_torch(SwiFTCropModel,
                                               "swift_crop_config.joblib",
                                               "swift_crop_model.pth")
        self._swift_encoder = self._load("swift_crop_encoder.joblib")
        self._swift_scaler  = self._load("swift_crop_scaler.joblib")
        self._swift_feats   = self._load("swift_crop_feature_names.joblib")

        # 2. TTL Irrigation
        self._ttl_model     = self._load_torch(TTLIrrigationModel,
                                               "ttl_irrigation_config.joblib",
                                               "ttl_irrigation_model.pth")
        self._ttl_scaler    = self._load("ttl_irrigation_scaler.joblib")
        self._ttl_labels    = self._load("ttl_irrigation_labels.joblib")
        self._ttl_num_feats = self._load("ttl_irrigation_num_features.joblib")
        self._ttl_crop_enc  = self._load("ttl_irrig_crop_encoder.joblib")
        self._ttl_stage_enc = self._load("ttl_irrig_stage_encoder.joblib")

        # 3. TabNet Soil Fertility
        soil_zip = os.path.join(settings.ML_MODELS_DIR, "tabnet_soil_model.zip")
        if os.path.exists(soil_zip):
            self._soil_model = TabNetClassifier()
            self._soil_model.load_model(soil_zip)
            logger.info("[ML] Loaded: tabnet_soil_model.zip")
        self._soil_encoder    = self._load("soil_fertility_encoder.joblib")
        self._soil_scaler     = self._load("soil_feature_scaler.joblib")
        self._soil_feats      = self._load("soil_feature_names.joblib")
        self._soil_background = self._load("soil_lime_background.joblib")

        # 4. TabNet Fertilizer
        fert_zip = os.path.join(settings.ML_MODELS_DIR, "tabnet_fert_model.zip")
        if os.path.exists(fert_zip):
            self._fert_model = TabNetClassifier()
            self._fert_model.load_model(fert_zip)
            logger.info("[ML] Loaded: tabnet_fert_model.zip")
        self._fert_encoder    = self._load("fert_label_encoder.joblib")
        self._fert_scaler     = self._load("fert_feature_scaler.joblib")
        self._fert_soil_enc   = self._load("fert_soil_type_encoder.joblib")
        self._fert_crop_enc   = self._load("fert_crop_type_encoder.joblib")
        self._fert_feats      = self._load("fert_feature_names.joblib")
        self._fert_background = self._load("fert_lime_background.joblib")

        loaded = sum(m is not None for m in [
            self._swift_model, self._ttl_model,
            self._soil_model,  self._fert_model,
        ])
        self._models_loaded = loaded > 0
        logger.info(f"[ML] {loaded}/4 Phase 8 models loaded.")

        if loaded == 0:
            logger.warning(
                "[ML] No models loaded. Run: python ml/train_models.py\n"
                "     Then restart the server."
            )

    def is_ready(self) -> bool:
        return self._models_loaded

    # ── Crop Recommendation (SwiFT) ───────────────────────────

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
        if self._swift_model is None:
            logger.warning("[ML] SwiFT crop model not loaded.")
            return None
        try:
            npk_total   = nitrogen + phosphorus + potassium
            n_to_p      = nitrogen / (phosphorus + 1e-3)
            n_to_k      = nitrogen / (potassium  + 1e-3)
            p_to_k      = phosphorus / (potassium + 1e-3)
            heat_index  = temperature * (1 - humidity / 200)
            water_score = rainfall * humidity / 100

            feat = np.array([[nitrogen, phosphorus, potassium, temperature, humidity,
                              ph, rainfall, npk_total, n_to_p, n_to_k, p_to_k,
                              heat_index, water_score]], dtype=np.float32)
            feat_sc = self._swift_scaler.transform(feat)

            with torch.no_grad():
                logits = self._swift_model(torch.tensor(feat_sc, dtype=torch.float32).to(DEVICE))
                probas = torch.softmax(logits, dim=1)[0].cpu().numpy()

            top_idx = np.argsort(probas)[::-1][:3]
            top_3   = [(self._swift_encoder.classes_[i], round(float(probas[i]), 4))
                       for i in top_idx]
            best    = top_3[0][0]

            return CropRecommendation(
                crop           = best,
                confidence     = top_3[0][1],
                top_3          = top_3,
                advice         = CROP_ADVICE.get(best.lower(),
                                 f"Ensure proper soil management for {best} cultivation."),
                input_features = {
                    "N": nitrogen, "P": phosphorus, "K": potassium,
                    "temperature": temperature, "humidity": humidity,
                    "pH": ph, "rainfall_mm": rainfall,
                },
            )
        except Exception as e:
            logger.error(f"[ML] Crop prediction failed: {e}")
            return None

    # ── Irrigation Advice (TTL, dual-mode) ────────────────────

    def predict_irrigation(
        self,
        soil_moisture: float,
        temperature:   float,
        humidity:      float,
        ph:            float,
        rainfall_mm:   float,
        crop_type:     str   = "Wheat",
        growth_stage:  str   = "mid_season",
        crop_aware:    bool  = False,
    ) -> Optional[IrrigationRecommendation]:
        if self._ttl_model is None:
            logger.warning("[ML] TTL irrigation model not loaded.")
            return None
        try:
            try:
                crop_enc = int(self._ttl_crop_enc.transform([crop_type])[0])
            except (ValueError, AttributeError):
                crop_enc = 0
            try:
                stage_enc = int(self._ttl_stage_enc.transform([growth_stage])[0])
            except (ValueError, AttributeError):
                stage_enc = 2  # mid_season default

            Kc  = _CROP_KC.get(crop_type, 1.0) * _STAGE_MOD.get(growth_stage, 1.0)
            ET0 = max(0.5, 0.0023 * (temperature + 17.8) *
                      (abs(temperature - 18) ** 0.5 + 3) * 0.40)
            ETc = ET0 * Kc
            vpd = (1 - humidity / 100) * temperature
            depl = max(0.0, (100 - soil_moisture) + (ETc - rainfall_mm * 0.75 / 7) * 2.5)

            x_num = np.array([[soil_moisture, temperature, humidity, ph,
                               rainfall_mm, ET0, ETc, vpd, min(depl, 100)]],
                             dtype=np.float32)
            x_cat = np.array([[crop_enc, stage_enc]], dtype=np.int64)

            x_num_sc = self._ttl_scaler.transform(x_num)

            with torch.no_grad():
                logits = self._ttl_model(
                    torch.tensor(x_num_sc, dtype=torch.float32).to(DEVICE),
                    torch.tensor(x_cat,    dtype=torch.long).to(DEVICE),
                )
                probas = torch.softmax(logits, dim=1)[0].cpu().numpy()

            pred_class = int(np.argmax(probas))
            labels = self._ttl_labels or [
                "No Irrigation", "Irrigation Recommended", "Highly Recommended",
                "Very Dry", "Immediate Irrigation",
            ]

            return IrrigationRecommendation(
                action          = labels[pred_class],
                confidence      = round(float(probas[pred_class]), 4),
                advice          = IRRIGATION_ADVICE[pred_class],
                water_amount_mm = IRRIGATION_WATER_MM[pred_class],
                urgency         = IRRIGATION_URGENCY[pred_class],
                crop_aware      = crop_aware,
                input_features  = {
                    "soil_moisture_pct": soil_moisture,
                    "temperature_c":     temperature,
                    "humidity_pct":      humidity,
                    "ph_value":          ph,
                    "rainfall_mm":       rainfall_mm,
                    "crop_type":         crop_type,
                    "growth_stage":      growth_stage,
                    "ET0":               round(ET0, 3),
                    "ETc":               round(ETc, 3),
                    "crop_aware_mode":   crop_aware,
                },
            )
        except Exception as e:
            logger.error(f"[ML] Irrigation prediction failed: {e}")
            return None

    # ── Fertilizer Recommendation (TabNet + LIME) ─────────────

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
        explain:     bool = False,
    ) -> Optional[FertilizerRecommendation]:
        if self._fert_model is None:
            logger.warning("[ML] TabNet fertilizer model not loaded.")
            return None
        try:
            try:
                soil_enc = int(self._fert_soil_enc.transform([soil_type])[0])
            except (ValueError, AttributeError):
                soil_enc = 0
            try:
                crop_enc = int(self._fert_crop_enc.transform([crop_type])[0])
            except (ValueError, AttributeError):
                crop_enc = 0

            feat = np.array([[temperature, humidity, moisture,
                              soil_enc, crop_enc, nitrogen, potassium, phosphorus]],
                            dtype=np.float32)
            feat_sc = self._fert_scaler.transform(feat)

            probas   = self._fert_model.predict_proba(feat_sc)[0]
            top_idx  = np.argsort(probas)[::-1][:3]
            top_3    = [(self._fert_encoder.classes_[i], round(float(probas[i]), 4))
                        for i in top_idx]
            best_fert = top_3[0][0]

            npk_status = {
                "nitrogen":   "low" if nitrogen < 40 else ("high" if nitrogen > 80 else "optimal"),
                "phosphorus": "low" if phosphorus < 20 else ("high" if phosphorus > 60 else "optimal"),
                "potassium":  "low" if potassium < 20 else ("high" if potassium > 80 else "optimal"),
            }

            explanation = None
            if explain and self._fert_background is not None:
                explanation = self._lime_explain(
                    self._fert_model, self._fert_background,
                    feat_sc[0], self._fert_feats, self._fert_encoder.classes_
                )

            return FertilizerRecommendation(
                fertilizer     = best_fert,
                confidence     = top_3[0][1],
                top_3          = top_3,
                advice         = FERTILIZER_ADVICE.get(best_fert,
                                 f"Apply {best_fert} as recommended."),
                npk_status     = npk_status,
                input_features = {
                    "temperature": temperature, "humidity": humidity,
                    "moisture": moisture, "soil_type": soil_type,
                    "crop_type": crop_type, "N": nitrogen,
                    "K": potassium, "P": phosphorus,
                },
                explanation = explanation,
            )
        except Exception as e:
            logger.error(f"[ML] Fertilizer prediction failed: {e}")
            return None

    # ── Soil Fertility (TabNet + LIME) ────────────────────────

    def predict_soil_fertility(
        self,
        nitrogen:   float,
        phosphorus: float,
        potassium:  float,
        ph:         float,
        moisture:   float,
        explain:    bool = False,
    ) -> Optional[SoilFertilityResult]:
        if self._soil_model is None:
            logger.warning("[ML] TabNet soil model not loaded.")
            return None
        try:
            feat    = np.array([[nitrogen, phosphorus, potassium, ph, moisture]],
                               dtype=np.float32)
            feat_sc = self._soil_scaler.transform(feat)
            probas  = self._soil_model.predict_proba(feat_sc)[0]
            classes = self._soil_encoder.classes_
            pred_idx = int(np.argmax(probas))

            explanation = None
            if explain and self._soil_background is not None:
                explanation = self._lime_explain(
                    self._soil_model, self._soil_background,
                    feat_sc[0], self._soil_feats, classes
                )

            return SoilFertilityResult(
                fertility_class = classes[pred_idx],
                confidence      = round(float(probas[pred_idx]), 4),
                class_probs     = {c: round(float(p), 4) for c, p in zip(classes, probas)},
                advice          = SOIL_ADVICE.get(classes[pred_idx], ""),
                explanation     = explanation,
                input_features  = {
                    "N": nitrogen, "P": phosphorus, "K": potassium,
                    "pH": ph, "moisture": moisture,
                },
            )
        except Exception as e:
            logger.error(f"[ML] Soil fertility prediction failed: {e}")
            return None

    # ── LIME Explanation Helper ───────────────────────────────

    def _lime_explain(self, model, X_background, x_instance,
                      feature_names, class_names, top_features=5) -> Optional[dict]:
        """LIME local explanation for a single TabNet prediction."""
        try:
            from lime.lime_tabular import LimeTabularExplainer
            explainer = LimeTabularExplainer(
                X_background,
                feature_names         = list(feature_names),
                class_names           = [str(c) for c in class_names],
                mode                  = "classification",
                discretize_continuous = True,
                random_state          = 42,
            )
            exp = explainer.explain_instance(
                x_instance,
                model.predict_proba,
                num_features = top_features,
                num_samples  = 200,
            )
            return dict(exp.as_list())
        except Exception as e:
            logger.warning(f"[ML] LIME explanation failed: {e}")
            return None


# Single instance loaded at FastAPI startup
ml_service = MLService()
