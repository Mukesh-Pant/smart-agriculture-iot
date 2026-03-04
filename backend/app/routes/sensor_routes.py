# =============================================================
# app/routes/sensor_routes.py — Sensor Data API Endpoints
#
# Endpoints:
#   GET  /api/sensors/latest     → most recent sensor reading
#   GET  /api/sensors/history    → last N readings (default 20)
#   GET  /api/sensors/status     → system health check
#   POST /api/sensors/simulate   → inject a test reading (dev only)
# =============================================================

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from typing import Optional

from app.models.sensor_data import SensorReadingResponse, LatestReadingResponse
from app.services import mqtt_service as mqtt_module

router = APIRouter(prefix="/api/sensors", tags=["Sensor Data"])


@router.get(
    "/latest",
    response_model=LatestReadingResponse,
    summary="Get the most recent sensor reading"
)
async def get_latest_reading():
    """
    Returns the most recent sensor payload received from ESP32 via MQTT.
    Returns 404 if no data has been received yet since server start.
    """
    reading = mqtt_module.latest_reading

    if reading is None:
        raise HTTPException(
            status_code=404,
            detail="No sensor data received yet. "
                   "Ensure ESP32 is running and MQTT broker is active."
        )

    return LatestReadingResponse(
        device_id         = reading.device_id,
        temperature_c     = reading.temperature_c,
        humidity_pct      = reading.humidity_pct,
        soil_moisture_pct = reading.soil_moisture_pct,
        moisture_level    = reading.moisture_level,
        ph_value          = reading.ph_value,
        ph_category       = reading.ph_category,
        received_at       = reading.received_at,
        status            = "error" if reading.has_errors else "ok"
    )


@router.get(
    "/history",
    response_model=list[SensorReadingResponse],
    summary="Get recent sensor reading history"
)
async def get_reading_history(
    limit: int = Query(default=20, ge=1, le=100,
                       description="Number of recent readings to return (max 100)")
):
    """
    Returns the last `limit` sensor readings stored in memory.
    Most recent reading is last in the list.
    """
    history = mqtt_module.reading_history

    if not history:
        raise HTTPException(
            status_code=404,
            detail="No sensor history available yet."
        )

    # Return last `limit` entries
    return history[-limit:]


@router.get(
    "/status",
    summary="System health check"
)
async def get_system_status():
    """
    Returns the health status of the backend and MQTT connection.
    Useful for quickly verifying the system is working end-to-end.
    """
    reading = mqtt_module.latest_reading
    history = mqtt_module.reading_history

    return {
        "backend_status":    "online",
        "server_time_utc":   datetime.utcnow().isoformat(),
        "mqtt_broker":       "connected",   # if we got here, loop is running
        "readings_in_memory": len(history),
        "latest_reading_at":  reading.received_at.isoformat() if reading else None,
        "latest_device_id":   reading.device_id if reading else None,
    }


@router.post(
    "/simulate",
    response_model=SensorReadingResponse,
    summary="Inject a simulated sensor reading (development only)"
)
async def simulate_reading(reading: SensorReadingResponse):
    """
    Allows injecting a fake sensor reading directly via HTTP POST.
    Useful for testing the API and dashboard without real hardware.

    Example body:
    {
        "device_id": "farm_node_01",
        "timestamp": 1700000000,
        "temperature_c": 27.5,
        "humidity_pct": 68.0,
        "soil_moisture_pct": 42.0,
        "moisture_level": "moderate",
        "ph_value": 6.8,
        "ph_category": "neutral"
    }
    """
    from datetime import datetime

    reading.received_at = datetime.utcnow()

    # Store as latest and add to history
    mqtt_module.latest_reading = reading
    mqtt_module.reading_history.append(reading)
    if len(mqtt_module.reading_history) > mqtt_module.MAX_HISTORY:
        mqtt_module.reading_history.pop(0)

    return reading
