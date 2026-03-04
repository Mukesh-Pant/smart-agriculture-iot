# =============================================================
# app/core/settings.py — Centralised Configuration
# Loads all environment variables from .env using pydantic-settings.
# Every other module imports from here — never from os.environ directly.
# =============================================================

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All application settings loaded from the .env file.
    Pydantic validates types automatically — if MQTT_BROKER_PORT
    is missing or not an integer, the app fails loudly on startup
    rather than silently breaking later.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"          # ignore unknown keys in .env
    )

    # ── FastAPI ───────────────────────────────────────────────
    APP_HOST:    str = "0.0.0.0"
    APP_PORT:    int = 8000
    APP_DEBUG:   bool = True
    APP_TITLE:   str = "Smart Agriculture API"
    APP_VERSION: str = "1.0.0"

    # ── MQTT ──────────────────────────────────────────────────
    MQTT_BROKER_HOST:      str = "localhost"
    MQTT_BROKER_PORT:      int = 1883
    MQTT_TOPIC_SENSOR_DATA: str = "smart_agriculture/sensor_data"
    MQTT_CLIENT_ID:        str = "fastapi_backend_01"

    # ── MongoDB ───────────────────────────────────────────────
    MONGO_URI:     str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "smart_agriculture"

    # ── Weather API ───────────────────────────────────────────
    WEATHER_API_KEY: str = ""
    WEATHER_CITY:    str = "Mahendranagar"


# Single instance imported everywhere
settings = Settings()
