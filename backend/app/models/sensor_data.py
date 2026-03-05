# =============================================================
# app/models/sensor_data.py — Sensor Data Schemas
# Pydantic models define the exact shape of data flowing through
# the system. If ESP32 sends bad data, these models catch it.
# =============================================================

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class SensorStatus(BaseModel):
    """Health status reported by each sensor on the ESP32."""
    dht22:         Literal["ok", "error"]
    soil_moisture: Literal["ok", "error"]
    ph:            Literal["ok", "error"]


class SensorReading(BaseModel):
    """
    Full sensor payload published by ESP32 via MQTT.
    Matches exactly the dict built by esp32/utils/data_formatter.py.
    Optional fields handle partial data when a sensor errors.
    """
    device_id:  str   = Field(..., description="Unique ESP32 device identifier")
    timestamp:  float = Field(..., description="Unix epoch timestamp from ESP32")

    # Environmental (DHT22)
    temperature_c: Optional[float] = Field(None, ge=-40, le=80)
    humidity_pct:  Optional[float] = Field(None, ge=0,   le=100)

    # Soil moisture
    soil_moisture_pct: Optional[float]                       = Field(None, ge=0, le=100)
    moisture_level:    Optional[Literal["dry", "moderate", "wet"]] = None

    # pH
    ph_value:    Optional[float] = Field(None, ge=0, le=14)
    ph_category: Optional[str]  = None

    # Sensor health
    sensor_status: Optional[SensorStatus] = None


class SensorReadingResponse(SensorReading):
    """
    Response model — adds server-side fields not present in raw MQTT payload.
    Used when returning data from API endpoints.
    """
    id:          Optional[str]  = None       # MongoDB _id (populated after DB save)
    received_at: datetime       = Field(default_factory=datetime.utcnow)
    has_errors:  bool           = False


class LatestReadingResponse(BaseModel):
    """Simplified response for the /latest endpoint."""
    device_id:         str
    temperature_c:     Optional[float]
    humidity_pct:      Optional[float]
    soil_moisture_pct: Optional[float]
    moisture_level:    Optional[str]
    ph_value:          Optional[float]
    ph_category:       Optional[str]
    received_at:       datetime
    mongo_id:          Optional[str] = None  # MongoDB _id for reference
    status:            str = "ok"


# ── Analytics Models ──────────────────────────────────────────

class SensorStats(BaseModel):
    """Min / avg / max for a single sensor metric."""
    avg: Optional[float]
    min: Optional[float]
    max: Optional[float]


class DailySummaryResponse(BaseModel):
    """
    Aggregated daily statistics returned by GET /api/sensors/summary/daily.
    Computed entirely in MongoDB using an aggregation pipeline.
    """
    device_id:      Optional[str]
    date:           str
    total_readings: int
    temperature:    Optional[SensorStats]
    humidity:       Optional[SensorStats]
    soil_moisture:  Optional[SensorStats]
    ph:             Optional[SensorStats]
    first_reading:  Optional[datetime]
    last_reading:   Optional[datetime]


class PaginatedHistoryResponse(BaseModel):
    """Paginated history response with metadata."""
    total:    int
    page:     int
    limit:    int
    readings: list[SensorReadingResponse]
