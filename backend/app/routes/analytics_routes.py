# =============================================================
# app/routes/analytics_routes.py — Analytics & Aggregation API
#
# These endpoints use MongoDB aggregation pipelines to compute
# statistics — all heavy lifting is done inside the database,
# not in Python. This is efficient and scales well.
#
# Endpoints:
#   GET /api/analytics/summary/daily     → today's min/avg/max
#   GET /api/analytics/range             → readings between two datetimes
#   GET /api/analytics/devices           → list of known device IDs
# =============================================================

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional

from app.models.sensor_data import DailySummaryResponse
from app.database.repository import sensor_repository
from app.database.mongodb import is_connected, get_database
from app.core.settings import settings

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _require_db():
    """Helper — raises 503 if MongoDB is not connected."""
    if not is_connected():
        raise HTTPException(
            status_code=503,
            detail="MongoDB is not connected. Analytics require database access."
        )


@router.get(
    "/summary/daily",
    response_model=DailySummaryResponse,
    summary="Get aggregated daily statistics for all sensors"
)
async def get_daily_summary(
    date:      Optional[str] = Query(
        default=None,
        description="Date in YYYY-MM-DD format. Defaults to today (UTC)."
    ),
    device_id: Optional[str] = Query(default=None, description="Filter by device ID")
):
    """
    Returns min/avg/max for temperature, humidity, soil moisture, and pH
    for the specified date. Computed using a MongoDB aggregation pipeline.

    Example: GET /api/analytics/summary/daily?date=2024-11-15
    """
    _require_db()

    # Parse date or default to today
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail="Invalid date format. Use YYYY-MM-DD (e.g. 2024-11-15)"
            )
    else:
        target_date = datetime.utcnow()

    summary = await sensor_repository.get_daily_summary(
        date=target_date,
        device_id=device_id
    )

    if not summary:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for {target_date.strftime('%Y-%m-%d')}. "
                   "Ensure readings have been collected for this date."
        )

    return DailySummaryResponse(**summary)


@router.get(
    "/range",
    summary="Get sensor readings within a datetime range"
)
async def get_readings_in_range(
    start: str = Query(
        ...,
        description="Start datetime in ISO format: 2024-11-15T00:00:00"
    ),
    end: str = Query(
        ...,
        description="End datetime in ISO format: 2024-11-15T23:59:59"
    ),
    device_id: Optional[str] = Query(default=None),
    limit:     int            = Query(default=100, ge=1, le=500)
):
    """
    Returns all sensor readings between start and end datetimes.
    Useful for plotting charts on the dashboard for a custom date range.
    """
    _require_db()

    try:
        start_dt = datetime.fromisoformat(start)
        end_dt   = datetime.fromisoformat(end)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Invalid datetime format. Use ISO format: 2024-11-15T08:00:00"
        )

    if start_dt >= end_dt:
        raise HTTPException(
            status_code=422,
            detail="'start' must be earlier than 'end'."
        )

    if (end_dt - start_dt).days > 31:
        raise HTTPException(
            status_code=422,
            detail="Date range cannot exceed 31 days per request."
        )

    docs = await sensor_repository.get_range(
        start=start_dt, end=end_dt,
        device_id=device_id, limit=limit
    )

    return {
        "start":          start_dt.isoformat(),
        "end":            end_dt.isoformat(),
        "total_returned": len(docs),
        "device_id":      device_id,
        "readings":       docs
    }


@router.get(
    "/summary/week",
    summary="Get daily summaries for the past 7 days"
)
async def get_weekly_summary(
    device_id: Optional[str] = Query(default=None)
):
    """
    Returns a daily summary for each of the last 7 days.
    Useful for a weekly trend chart on the dashboard.
    """
    _require_db()

    summaries = []
    today = datetime.utcnow()

    for days_ago in range(6, -1, -1):   # 6 days ago → today
        target = today - timedelta(days=days_ago)
        summary = await sensor_repository.get_daily_summary(
            date=target, device_id=device_id
        )
        if summary:
            summaries.append(summary)

    return {
        "period":    "last_7_days",
        "device_id": device_id,
        "days":      len(summaries),
        "summaries": summaries
    }


@router.get(
    "/devices",
    summary="List all known device IDs in the database"
)
async def get_known_devices():
    """
    Returns a list of all unique device_id values stored in MongoDB.
    Useful for a multi-device dropdown on the dashboard.
    """
    _require_db()

    try:
        db = get_database()
        collection = db[settings.MONGO_COLLECTION_READINGS]
        device_ids = await collection.distinct("device_id")
        return {
            "total":   len(device_ids),
            "devices": device_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
