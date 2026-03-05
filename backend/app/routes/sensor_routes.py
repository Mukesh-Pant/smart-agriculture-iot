# =============================================================
# app/routes/sensor_routes.py — Sensor Data API Endpoints
#
# Phase 3 update: /history and /latest now serve from MongoDB
# when available, falling back to in-memory if DB is down.
#
# Endpoints:
#   GET  /api/sensors/latest          → most recent reading
#   GET  /api/sensors/history         → paginated DB history
#   GET  /api/sensors/status          → system health check
#   GET  /api/sensors/{id}            → single reading by MongoDB _id
#   POST /api/sensors/simulate        → inject test reading
# =============================================================

from fastapi import APIRouter, HTTPException, Query, Path
from datetime import datetime
from typing import Optional

from app.models.sensor_data import (
    SensorReadingResponse,
    LatestReadingResponse,
    PaginatedHistoryResponse,
)
from app.services import mqtt_service as mqtt_module
from app.database.repository import sensor_repository
from app.database.mongodb import is_connected

router = APIRouter(prefix="/api/sensors", tags=["Sensor Data"])


@router.get(
    "/latest",
    response_model=LatestReadingResponse,
    summary="Get the most recent sensor reading"
)
async def get_latest_reading():
    """
    Returns the most recent sensor reading.
    Tries MongoDB first (persistent), falls back to in-memory cache.
    """
    # Try MongoDB first — it survives server restarts
    if is_connected():
        doc = await sensor_repository.get_latest()
        if doc:
            return LatestReadingResponse(
                device_id         = doc.get("device_id"),
                temperature_c     = doc.get("temperature_c"),
                humidity_pct      = doc.get("humidity_pct"),
                soil_moisture_pct = doc.get("soil_moisture_pct"),
                moisture_level    = doc.get("moisture_level"),
                ph_value          = doc.get("ph_value"),
                ph_category       = doc.get("ph_category"),
                received_at       = doc.get("received_at", datetime.utcnow()),
                mongo_id          = doc.get("id"),
                status            = "ok"
            )

    # Fallback: in-memory (no DB or no DB data yet)
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
        mongo_id          = reading.id,
        status            = "error" if reading.has_errors else "ok"
    )


@router.get(
    "/history",
    response_model=PaginatedHistoryResponse,
    summary="Get paginated sensor reading history from MongoDB"
)
async def get_reading_history(
    page:      int = Query(default=1,  ge=1,   description="Page number"),
    limit:     int = Query(default=20, ge=1, le=500, description="Readings per page"),
    device_id: Optional[str] = Query(default=None,  description="Filter by device ID")
):
    """
    Returns paginated sensor readings from MongoDB, newest first.
    Falls back to in-memory history if MongoDB is unavailable.
    """
    if is_connected():
        skip  = (page - 1) * limit
        docs  = await sensor_repository.get_history(
            limit=limit, skip=skip, device_id=device_id
        )
        total = await sensor_repository.count_readings(device_id=device_id)

        readings = []
        for doc in docs:
            try:
                readings.append(SensorReadingResponse(**doc))
            except Exception:
                continue

        return PaginatedHistoryResponse(
            total=total, page=page, limit=limit, readings=readings
        )

    # Fallback: in-memory
    history = mqtt_module.reading_history
    if not history:
        raise HTTPException(status_code=404, detail="No sensor history available yet.")

    return PaginatedHistoryResponse(
        total    = len(history),
        page     = 1,
        limit    = len(history),
        readings = history[-limit:]
    )


@router.get(
    "/status",
    summary="Full system health status"
)
async def get_system_status():
    """Returns health of backend, MQTT, MongoDB, and reading counts."""
    reading = mqtt_module.latest_reading
    history = mqtt_module.reading_history
    db_count = await sensor_repository.count_readings() if is_connected() else 0

    return {
        "backend_status":       "online",
        "server_time_utc":      datetime.utcnow().isoformat(),
        "mqtt_broker":          "connected",
        "mongodb_status":       "connected" if is_connected() else "disconnected",
        "total_readings_in_db": db_count,
        "readings_in_memory":   len(history),
        "latest_reading_at":    reading.received_at.isoformat() if reading else None,
        "latest_device_id":     reading.device_id if reading else None,
    }


@router.get(
    "/{reading_id}",
    response_model=SensorReadingResponse,
    summary="Get a single reading by MongoDB ID"
)
async def get_reading_by_id(
    reading_id: str = Path(..., description="MongoDB _id of the reading")
):
    """Fetches one specific sensor reading by its MongoDB document ID."""
    if not is_connected():
        raise HTTPException(status_code=503, detail="MongoDB not available.")

    doc = await sensor_repository.get_by_id(reading_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Reading '{reading_id}' not found.")

    return SensorReadingResponse(**doc)


@router.post(
    "/simulate",
    response_model=SensorReadingResponse,
    summary="Inject a simulated sensor reading (development only)"
)
async def simulate_reading(reading: SensorReadingResponse):
    """
    Injects a fake sensor reading — saves to MongoDB AND in-memory.
    Use the Swagger UI at /docs to test without real hardware.
    """
    reading.received_at = datetime.utcnow()

    # Save to MongoDB
    if is_connected():
        inserted_id = await sensor_repository.save_reading(reading)
        if inserted_id:
            reading.id = inserted_id

    # Also store in memory
    mqtt_module.latest_reading = reading
    mqtt_module.reading_history.append(reading)
    if len(mqtt_module.reading_history) > mqtt_module.MAX_HISTORY:
        mqtt_module.reading_history.pop(0)

    return reading
