# =============================================================
# app/services/ml_service.py — ML Recommendation Engine
#
# Loads the trained .joblib models at startup and exposes
# three prediction methods:
#   - predict_crop()       → which crop to plant
#   - predict_fertilizer() → which fertilizer to apply
#   - predict_irrigation() → how much to irrigate
#
# Each method accepts sensor readings + weather data and returns
# a structured recommendation with confidence score and advice.
#
# All models are loaded once at startup — predictions are fast
# (milliseconds) because inference is just a tree traversal.
# =============================================================

import os
import logging
from typing import Optional
from dataclasses import dataclass, field

import numpy as np
import joblib

from app.core.settings import settings

logger = logging.getLogger(__name__)


# ── Recommendation Dataclasses ────────────────────────────────

@dataclass
class CropRecommendation:
    crop:            str
    confidence:      float              # 0.0 – 1.0
    top_3:           list               # [(crop, probability), ...]
    advice:          str
    input_features:  dict = field(default_factory=dict)


@dataclass
class FertilizerRecommendation:
    fertilizer:      str
    confidence:      float
    top_3:           list
    advice:          str
    npk_status:      dict = field(default_factory=dict)   # N/P/K levels
    input_features:  dict = field(default_factory=dict)


@dataclass
class IrrigationRecommendation:
    action:          str                # no_irrigation | light_irrigation | heavy_irrigation
    confidence:      float
    advice:          str
    water_amount_mm: Optional[float]    # estimated mm of water needed
    urgency:         str                # low | medium | high
    input_features:  dict = field(default_factory=dict)


# ── Advice Templates ──────────────────────────────────────────

CROP_ADVICE = {
    "rice":        "Rice thrives in waterlogged conditions. Ensure adequate irrigation.",
    "maize":       "Maize needs well-drained soil. Avoid waterlogging.",
    "chickpea":    "Chickpea prefers dry conditions. Reduce irrigation frequency.",
    "kidneybeans": "Kidney beans need consistent moisture. Monitor soil regularly.",
    "pigeonpeas":  "Pigeon peas are drought-tolerant. Water sparingly.",
    "mothbeans":   "Moth beans are drought-resistant. Minimal irrigation needed.",
    "mungbean":    "Mung beans need moderate water. Avoid overwatering.",
    "blackgram":   "Black gram grows best in warm, humid conditions.",
    "lentil":      "Lentils prefer cool weather. Plant in early winter.",
    "pomegranate": "Pomegranate is drought-tolerant once established.",
    "banana":      "Banana needs high moisture. Irrigate frequently.",
    "mango":       "Mango trees prefer dry spells before flowering.",
    "grapes":      "Grapes need well-drained soil. Avoid excess moisture.",
    "watermelon":  "Watermelons need consistent moisture during fruiting.",
    "muskmelon":   "Muskmelons need warm weather and moderate irrigation.",
    "apple":       "Apple trees need deep, well-drained, fertile soil.",
    "orange":      "Orange trees need regular watering and warm climate.",
    "papaya":      "Papaya grows best in warm, humid conditions.",
    "coconut":     "Coconut palms thrive near coastal areas.",
    "cotton":      "Cotton prefers hot, dry conditions with moderate rainfall.",
    "jute":        "Jute thrives in warm, humid conditions with heavy rainfall.",
    "coffee":      "Coffee needs shade, humidity, and well-drained acidic soil.",
}

FERTILIZER_ADVICE = {
    "Urea":           "Apply Urea for nitrogen deficiency. Use 45–60 kg/ha. Avoid over-application.",
    "DAP":            "DAP provides nitrogen and phosphorus. Apply at sowing time.",
    "14-35-14":       "Balanced NPK fertilizer. Apply during active growth phase.",
    "28-28":          "High N and P formula. Suitable for nitrogen-deficient crops.",
    "17-17-17":       "Equal NPK ratio. Good general-purpose fertilizer.",
    "20-20":          "Nitrogen and phosphorus blend. Apply before planting.",
    "10-26-26":       "High phosphorus and potassium. Good for root development.",
}

IRRIGATION_ADVICE = {
    "no_irrigation":    "Soil moisture is adequate. No irrigation needed right now.",
    "light_irrigation": "Soil is slightly dry. Apply 15–20mm of water.",
    "heavy_irrigation": "Soil is critically dry. Apply 30–40mm of water urgently.",
}

IRRIGATION_URGENCY = {
    "no_irrigation":    "low",
    "light_irrigation": "medium",
    "heavy_irrigation": "high",
}

IRRIGATION_WATER_MM = {
    "no_irrigation":    None,
    "light_irrigation": 17.5,
    "heavy_irrigation": 35.0,
}


# ── ML Service ────────────────────────────────────────────────

class MLService:
    """
    Loads trained scikit-learn models from disk and runs inference.
    All three models are loaded once at startup for fast predictions.
    """

    def __init__(self):
        # Crop model artefacts
        self._crop_model   = None
        self._crop_encoder = None
        self._crop_scaler  = None

        # Fertilizer model artefacts
        self._fert_model        = None
        self._fert_encoder      = None
        self._fert_scaler       = None
        self._soil_encoder      = None
        self._crop_type_encoder = None

        # Irrigation model artefacts
        self._irrig_model   = None
        self._irrig_encoder = None
        self._irrig_scaler  = None

        self._models_loaded = False

    def _load(self, filename: str):
        """Loads a single .joblib file. Returns None if not found."""
        path = os.path.join(settings.ML_MODELS_DIR, filename)
        if not os.path.exists(path):
            logger.warning(f"[ML] Model file not found: {path}")
            return None
        obj = joblib.load(path)
        logger.info(f"[ML] Loaded: {filename}")
        return obj

    def load_all_models(self):
        """
        Loads all trained models from ml/saved_models/.
        Called once at FastAPI startup. Safe to call if files are missing
        — the service degrades gracefully with a warning.
        """
        logger.info("[ML] Loading recommendation models...")

        self._crop_model   = self._load("crop_recommendation_model.joblib")
        self._crop_encoder = self._load("crop_label_encoder.joblib")
        self._crop_scaler  = self._load("crop_feature_scaler.joblib")

        self._fert_model        = self._load("fertilizer_recommendation_model.joblib")
        self._fert_encoder      = self._load("fertilizer_label_encoder.joblib")
        self._fert_scaler       = self._load("fertilizer_feature_scaler.joblib")
        self._soil_encoder      = self._load("soil_type_encoder.joblib")
        self._crop_type_encoder = self._load("crop_type_encoder.joblib")

        self._irrig_model   = self._load("irrigation_recommendation_model.joblib")
        self._irrig_encoder = self._load("irrigation_label_encoder.joblib")
        self._irrig_scaler  = self._load("irrigation_feature_scaler.joblib")

        loaded = sum([
            self._crop_model is not None,
            self._fert_model is not None,
            self._irrig_model is not None,
        ])

        self._models_loaded = loaded > 0
        logger.info(f"[ML] {loaded}/3 models loaded successfully.")

        if loaded == 0:
            logger.warning(
                "[ML] No models loaded. Run: python ml/train_models.py\n"
                "     Then restart the server."
            )

    def is_ready(self) -> bool:
        return self._models_loaded

    # ── Crop Recommendation ───────────────────────────────────

    def predict_crop(
        self,
        nitrogen:     float,
        phosphorus:   float,
        potassium:    float,
        temperature:  float,
        humidity:     float,
        ph:           float,
        rainfall:     float,
    ) -> Optional[CropRecommendation]:
        """
        Predicts the best crop to plant given soil and weather data.

        Args:
            nitrogen:    N content in soil (kg/ha)
            phosphorus:  P content in soil (kg/ha)
            potassium:   K content in soil (kg/ha)
            temperature: Air temperature (°C)
            humidity:    Relative humidity (%)
            ph:          Soil pH value
            rainfall:    Monthly rainfall (mm)
        """
        if self._crop_model is None:
            logger.warning("[ML] Crop model not loaded.")
            return None

        try:
            # Engineered features matching CROP_FEATS in train_models.py
            npk_total   = nitrogen + phosphorus + potassium
            n_to_p      = nitrogen / (phosphorus + 1e-3)
            n_to_k      = nitrogen / (potassium + 1e-3)
            p_to_k      = phosphorus / (potassium + 1e-3)
            heat_index  = temperature * (1 - humidity / 200)
            water_score = rainfall * humidity / 100

            features = np.array([[
                nitrogen, phosphorus, potassium,
                temperature, humidity, ph, rainfall,
                npk_total, n_to_p, n_to_k, p_to_k, heat_index, water_score
            ]])

            features_scaled = self._crop_scaler.transform(features)

            # Get class probabilities
            probas     = self._crop_model.predict_proba(features_scaled)[0]
            top_idx    = np.argsort(probas)[::-1][:3]
            top_3      = [
                (self._crop_encoder.classes_[i], round(float(probas[i]), 4))
                for i in top_idx
            ]
            best_crop  = top_3[0][0]
            confidence = top_3[0][1]

            advice = CROP_ADVICE.get(
                best_crop.lower(),
                f"Ensure proper soil management for {best_crop} cultivation."
            )

            return CropRecommendation(
                crop           = best_crop,
                confidence     = confidence,
                top_3          = top_3,
                advice         = advice,
                input_features = {
                    "N": nitrogen, "P": phosphorus, "K": potassium,
                    "temperature": temperature, "humidity": humidity,
                    "pH": ph, "rainfall_mm": rainfall,
                }
            )

        except Exception as e:
            logger.error(f"[ML] Crop prediction failed: {e}")
            return None

    # ── Fertilizer Recommendation ─────────────────────────────

    def predict_fertilizer(
        self,
        temperature:  float,
        humidity:     float,
        moisture:     float,
        soil_type:    str,
        crop_type:    str,
        nitrogen:     float,
        potassium:    float,
        phosphorus:   float,
    ) -> Optional[FertilizerRecommendation]:
        """
        Predicts the most appropriate fertilizer.

        Args:
            soil_type:  e.g. "Sandy", "Loamy", "Black", "Red", "Clayey"
            crop_type:  e.g. "Wheat", "Rice", "Maize", "Cotton", etc.
        """
        if self._fert_model is None:
            logger.warning("[ML] Fertilizer model not loaded.")
            return None

        try:
            # Encode categorical features
            # Handle unseen labels gracefully
            try:
                soil_enc = self._soil_encoder.transform([soil_type])[0]
            except ValueError:
                soil_enc = 0   # default to first class if unseen

            try:
                crop_enc = self._crop_type_encoder.transform([crop_type])[0]
            except ValueError:
                crop_enc = 0

            # Engineered features matching FERT_FEATS
            npk_total     = nitrogen + phosphorus + potassium
            n_deficiency  = 40 - nitrogen   if nitrogen < 40   else 0
            p_deficiency  = 20 - phosphorus if phosphorus < 20 else 0
            k_deficiency  = 20 - potassium  if potassium < 20  else 0
            moisture_temp = moisture * temperature / 100

            features = np.array([[
                temperature, humidity, moisture,
                soil_enc, crop_enc,
                nitrogen, potassium, phosphorus,
                npk_total, n_deficiency, p_deficiency, k_deficiency, moisture_temp
            ]])

            features_scaled = self._fert_scaler.transform(features)
            probas   = self._fert_model.predict_proba(features_scaled)[0]
            top_idx  = np.argsort(probas)[::-1][:3]
            top_3    = [
                (self._fert_encoder.classes_[i], round(float(probas[i]), 4))
                for i in top_idx
            ]
            best_fert  = top_3[0][0]
            confidence = top_3[0][1]

            # NPK status analysis
            npk_status = {
                "nitrogen":   "low" if nitrogen < 40 else ("high" if nitrogen > 80 else "optimal"),
                "phosphorus": "low" if phosphorus < 20 else ("high" if phosphorus > 60 else "optimal"),
                "potassium":  "low" if potassium < 20 else ("high" if potassium > 80 else "optimal"),
            }

            advice = FERTILIZER_ADVICE.get(
                best_fert,
                f"Apply {best_fert} as recommended. Follow package instructions."
            )

            return FertilizerRecommendation(
                fertilizer     = best_fert,
                confidence     = confidence,
                top_3          = top_3,
                advice         = advice,
                npk_status     = npk_status,
                input_features = {
                    "temperature": temperature, "humidity": humidity,
                    "moisture": moisture, "soil_type": soil_type,
                    "crop_type": crop_type, "N": nitrogen,
                    "K": potassium, "P": phosphorus,
                }
            )

        except Exception as e:
            logger.error(f"[ML] Fertilizer prediction failed: {e}")
            return None

    # ── Irrigation Recommendation ─────────────────────────────

    def predict_irrigation(
        self,
        soil_moisture: float,
        temperature:   float,
        humidity:      float,
        ph:            float,
        rainfall_mm:   float,
    ) -> Optional[IrrigationRecommendation]:
        """
        Predicts whether irrigation is needed and how much.
        This model uses real-time sensor data + weather rainfall.
        """
        if self._irrig_model is None:
            logger.warning("[ML] Irrigation model not loaded.")
            return None

        try:
            # Mock encodings for inference without frontend context
            crop_type_enc    = 0
            growth_stage_enc = 0
            
            # Engineered features matching IRRIG_FEATS
            vpd_proxy = (1 - humidity / 100) * temperature
            dryness   = (100 - soil_moisture) * vpd_proxy / 50
            eff_rain  = rainfall_mm * 0.75

            features = np.array([[
                soil_moisture, temperature, humidity, ph, rainfall_mm,
                crop_type_enc, growth_stage_enc, vpd_proxy, dryness, eff_rain
            ]])

            features_scaled = self._irrig_scaler.transform(features)
            probas     = self._irrig_model.predict_proba(features_scaled)[0]
            pred_class = int(self._irrig_model.predict(features_scaled)[0])
            confidence = float(probas[pred_class])

            action_names  = ["no_irrigation", "light_irrigation", "heavy_irrigation"]
            action        = action_names[pred_class]

            return IrrigationRecommendation(
                action          = action,
                confidence      = confidence,
                advice          = IRRIGATION_ADVICE[action],
                water_amount_mm = IRRIGATION_WATER_MM[action],
                urgency         = IRRIGATION_URGENCY[action],
                input_features  = {
                    "soil_moisture_pct": soil_moisture,
                    "temperature_c":     temperature,
                    "humidity_pct":      humidity,
                    "ph_value":          ph,
                    "rainfall_mm":       rainfall_mm,
                }
            )

        except Exception as e:
            logger.error(f"[ML] Irrigation prediction failed: {e}")
            return None


# Single instance loaded at startup
ml_service = MLService()
