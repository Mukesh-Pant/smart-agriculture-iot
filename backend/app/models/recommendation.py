# =============================================================
# app/models/recommendation.py — Weather & ML Response Schemas
# =============================================================

from pydantic import BaseModel, Field
from typing import Optional


# ── Weather Models ────────────────────────────────────────────

class WeatherResponse(BaseModel):
    """Current weather data returned by GET /api/weather/current"""
    city:                 str
    country:              str
    temperature_c:        float
    feels_like_c:         float
    temp_min_c:           float
    temp_max_c:           float
    humidity_pct:         float
    pressure_hpa:         float
    wind_speed_ms:        float
    cloudiness_pct:       int
    rainfall_1h_mm:       float
    rainfall_3h_mm:       float
    rainfall_monthly_mm:  float
    condition_main:       str
    condition_desc:       str
    condition_icon:       str
    fetched_at:           float


# ── Recommendation Request Models ────────────────────────────

class CropRecommendationRequest(BaseModel):
    """
    Input for crop recommendation.
    NPK values can be provided manually or fetched from sensor (future NPK sensor).
    Weather fields are auto-filled from WeatherService if not provided.
    """
    nitrogen:    float = Field(..., ge=0,  le=200, description="Nitrogen (kg/ha)")
    phosphorus:  float = Field(..., ge=0,  le=200, description="Phosphorus (kg/ha)")
    potassium:   float = Field(..., ge=0,  le=200, description="Potassium (kg/ha)")
    ph:          float = Field(..., ge=0,  le=14,  description="Soil pH")

    # Optional — auto-filled from live sensors/weather if omitted
    temperature: Optional[float] = Field(None, ge=-10, le=60)
    humidity:    Optional[float] = Field(None, ge=0,   le=100)
    rainfall:    Optional[float] = Field(None, ge=0,   le=500,
                                         description="Monthly rainfall (mm)")

    class Config:
        json_schema_extra = {
            "example": {
                "nitrogen": 90, "phosphorus": 42, "potassium": 43,
                "ph": 6.5, "temperature": 28.0,
                "humidity": 82.0, "rainfall": 202.9
            }
        }


class FertilizerRecommendationRequest(BaseModel):
    """Input for fertilizer recommendation."""
    nitrogen:    float = Field(..., ge=0, le=200)
    phosphorus:  float = Field(..., ge=0, le=200)
    potassium:   float = Field(..., ge=0, le=200)
    soil_type:   str   = Field(..., description="Sandy | Loamy | Black | Red | Clayey")
    crop_type:   str   = Field(..., description="e.g. Wheat, Rice, Maize, Cotton")

    # Auto-filled from live sensors if omitted
    temperature: Optional[float] = Field(None, ge=-10, le=60)
    humidity:    Optional[float] = Field(None, ge=0,   le=100)
    moisture:    Optional[float] = Field(None, ge=0,   le=100,
                                         description="Soil moisture (%)")

    class Config:
        json_schema_extra = {
            "example": {
                "nitrogen": 37, "phosphorus": 0, "potassium": 0,
                "soil_type": "Sandy", "crop_type": "Maize",
                "temperature": 26.0, "humidity": 52.0, "moisture": 38.0
            }
        }


class IrrigationRecommendationRequest(BaseModel):
    """
    Input for irrigation recommendation.
    All fields auto-filled from live sensor + weather data if not provided.
    """
    soil_moisture: Optional[float] = Field(None, ge=0,  le=100)
    temperature:   Optional[float] = Field(None, ge=-10, le=60)
    humidity:      Optional[float] = Field(None, ge=0,  le=100)
    ph:            Optional[float] = Field(None, ge=0,  le=14)
    rainfall_mm:   Optional[float] = Field(None, ge=0,  le=500)


# ── Recommendation Response Models ───────────────────────────

class TopPrediction(BaseModel):
    label:       str
    probability: float


class CropRecommendationResponse(BaseModel):
    crop:           str
    confidence:     float
    confidence_pct: str
    top_3_crops:    list[TopPrediction]
    advice:         str
    input_used:     dict
    weather_used:   bool = False


class FertilizerRecommendationResponse(BaseModel):
    fertilizer:       str
    confidence:       float
    confidence_pct:   str
    top_3_fertilizers: list[TopPrediction]
    advice:           str
    npk_status:       dict
    input_used:       dict
    weather_used:     bool = False


class IrrigationRecommendationResponse(BaseModel):
    action:          str
    confidence:      float
    confidence_pct:  str
    advice:          str
    water_amount_mm: Optional[float]
    urgency:         str
    input_used:      dict
    weather_used:    bool = False


class FullRecommendationResponse(BaseModel):
    """
    Combined response from GET /api/recommend/full
    Runs all three models in one call using latest sensor + weather data.
    This is the primary endpoint for the farmer dashboard.
    """
    sensor_data_used:  Optional[dict]
    weather_data_used: Optional[dict]
    crop:              Optional[CropRecommendationResponse]
    fertilizer:        Optional[FertilizerRecommendationResponse]
    irrigation:        Optional[IrrigationRecommendationResponse]
    ml_ready:          bool
    weather_available: bool
    warnings:          list[str] = []
