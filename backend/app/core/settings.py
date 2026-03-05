# =============================================================
# app/core/settings.py — Centralised Configuration
# =============================================================

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # ── FastAPI ───────────────────────────────────────────────
    APP_HOST:    str  = "0.0.0.0"
    APP_PORT:    int  = 8000
    APP_DEBUG:   bool = True
    APP_TITLE:   str  = "Smart Agriculture API"
    APP_VERSION: str  = "1.0.0"

    # ── MQTT ──────────────────────────────────────────────────
    MQTT_BROKER_HOST:       str = "localhost"
    MQTT_BROKER_PORT:       int = 1883
    MQTT_TOPIC_SENSOR_DATA: str = "smart_agriculture/sensor_data"
    MQTT_CLIENT_ID:         str = "fastapi_backend_01"

    # ── MongoDB ───────────────────────────────────────────────
    MONGO_URI:                 str = "mongodb://localhost:27017"
    MONGO_DB_NAME:             str = "smart_agriculture"
    MONGO_COLLECTION_READINGS: str = "sensor_readings"
    MONGO_COLLECTION_DAILY:    str = "daily_summaries"

    # ── Weather API (OpenWeatherMap) ──────────────────────────
    WEATHER_API_KEY:      str   = ""
    WEATHER_CITY:         str   = "Mahendranagar"
    WEATHER_COUNTRY_CODE: str   = "NP"          # Nepal
    WEATHER_CACHE_TTL:    int   = 600            # seconds — re-fetch every 10 min

    # ── Machine Learning ──────────────────────────────────────
    ML_MODELS_DIR:        str   = "ml/saved_models"
    ML_DATASETS_DIR:      str   = "ml/datasets"
    ML_CROP_MODEL_FILE:   str   = "crop_recommendation_model.joblib"
    ML_FERT_MODEL_FILE:   str   = "fertilizer_recommendation_model.joblib"
    ML_IRRIG_MODEL_FILE:  str   = "irrigation_recommendation_model.joblib"
    ML_ENCODER_FILE:      str   = "label_encoders.joblib"
    ML_SCALER_FILE:       str   = "feature_scaler.joblib"
    ML_MIN_CONFIDENCE:    float = 0.45           # minimum probability to show recommendation


# Single instance imported everywhere
settings = Settings()
