# =============================================================
# app/database/repository.py — Sensor Data Repository
#
# The Repository Pattern separates database logic from business
# logic. Routes and services never write raw MongoDB queries —
# they call clean methods here instead.
#
# This makes the code:
#   - Testable (easy to mock the repository in tests)
#   - Maintainable (DB logic in one place)
#   - Swappable (change DB without touching routes)
# =============================================================

import logging
from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import DESCENDING

from app.core.settings import settings
from app.database.mongodb import get_database
from app.models.sensor_data import SensorReadingResponse

logger = logging.getLogger(__name__)


def _serialize(doc: dict) -> dict:
    """
    Converts MongoDB document to a clean Python dict.
    Transforms ObjectId → string so Pydantic can handle it.
    """
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


class SensorRepository:
    """
    All database operations for the sensor_readings collection.
    Every method is async — compatible with FastAPI's event loop.
    """

    @property
    def _collection(self):
        """Returns the collection, or None if DB is unavailable."""
        db = get_database()
        if db is None:
            return None
        return db[settings.MONGO_COLLECTION_READINGS]

    # ── WRITE ─────────────────────────────────────────────────

    async def save_reading(self, reading: SensorReadingResponse) -> Optional[str]:
        """
        Inserts one sensor reading document into MongoDB.

        Args:
            reading: Validated SensorReadingResponse object

        Returns:
            str: The inserted document's MongoDB _id as a string.
            None: If MongoDB is unavailable (graceful degradation).
        """
        collection = self._collection
        if collection is None:
            logger.warning("[Repository] MongoDB unavailable — skipping DB save.")
            return None

        try:
            # Convert Pydantic model → dict, exclude None values
            doc = reading.model_dump(exclude_none=True)

            # Remove our string id field — MongoDB generates its own _id
            doc.pop("id", None)

            # Ensure received_at is a proper datetime object
            if isinstance(doc.get("received_at"), str):
                doc["received_at"] = datetime.fromisoformat(doc["received_at"])

            # Flatten nested sensor_status for easier querying
            if "sensor_status" in doc and doc["sensor_status"]:
                doc["sensor_status"] = dict(doc["sensor_status"])

            result = await collection.insert_one(doc)
            inserted_id = str(result.inserted_id)

            logger.info(f"[Repository] Saved reading → _id: {inserted_id}")
            return inserted_id

        except Exception as e:
            logger.error(f"[Repository] Failed to save reading: {e}")
            return None

    # ── READ ──────────────────────────────────────────────────

    async def get_latest(
        self,
        device_id: Optional[str] = None
    ) -> Optional[dict]:
        """
        Returns the single most recent reading.

        Args:
            device_id: If provided, filters to that device only.
        """
        collection = self._collection
        if collection is None:
            return None

        try:
            query = {"device_id": device_id} if device_id else {}
            doc = await collection.find_one(
                query,
                sort=[("received_at", DESCENDING)]
            )
            return _serialize(doc) if doc else None

        except Exception as e:
            logger.error(f"[Repository] get_latest failed: {e}")
            return None

    async def get_history(
        self,
        limit:     int = 50,
        skip:      int = 0,
        device_id: Optional[str] = None,
    ) -> list[dict]:
        """
        Returns paginated sensor readings, newest first.

        Args:
            limit:     Number of documents to return (max 500).
            skip:      Number of documents to skip (for pagination).
            device_id: Filter to a specific ESP32 device.
        """
        collection = self._collection
        if collection is None:
            return []

        try:
            limit = min(limit, 500)   # hard cap — prevent massive queries
            query = {"device_id": device_id} if device_id else {}

            cursor = collection.find(query) \
                               .sort("received_at", DESCENDING) \
                               .skip(skip) \
                               .limit(limit)

            docs = await cursor.to_list(length=limit)
            return [_serialize(doc) for doc in docs]

        except Exception as e:
            logger.error(f"[Repository] get_history failed: {e}")
            return []

    async def get_by_id(self, reading_id: str) -> Optional[dict]:
        """Returns a single reading by its MongoDB _id string."""
        collection = self._collection
        if collection is None:
            return None

        try:
            doc = await collection.find_one({"_id": ObjectId(reading_id)})
            return _serialize(doc) if doc else None
        except InvalidId:
            return None
        except Exception as e:
            logger.error(f"[Repository] get_by_id failed: {e}")
            return None

    async def get_range(
        self,
        start:     datetime,
        end:       datetime,
        device_id: Optional[str] = None,
        limit:     int = 500
    ) -> list[dict]:
        """
        Returns all readings between start and end datetimes.
        Useful for daily/weekly analytics charts on the dashboard.
        """
        collection = self._collection
        if collection is None:
            return []

        try:
            query: dict = {"received_at": {"$gte": start, "$lte": end}}
            if device_id:
                query["device_id"] = device_id

            cursor = collection.find(query) \
                               .sort("received_at", DESCENDING) \
                               .limit(min(limit, 500))

            docs = await cursor.to_list(length=min(limit, 500))
            return [_serialize(doc) for doc in docs]

        except Exception as e:
            logger.error(f"[Repository] get_range failed: {e}")
            return []

    # ── AGGREGATION ───────────────────────────────────────────

    async def get_daily_summary(
        self,
        date:      Optional[datetime] = None,
        device_id: Optional[str] = None
    ) -> Optional[dict]:
        """
        Calculates min/max/avg for all sensor values over a single day.
        Uses MongoDB aggregation pipeline for server-side computation.

        Args:
            date:      The day to summarise (defaults to today UTC).
            device_id: Filter to specific device.

        Returns:
            dict with avg/min/max for temperature, humidity, moisture, pH.
        """
        collection = self._collection
        if collection is None:
            return None

        try:
            if date is None:
                date = datetime.utcnow()

            # Day boundaries
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end   = date.replace(hour=23, minute=59, second=59, microsecond=999999)

            match_stage: dict = {
                "$match": {
                    "received_at": {"$gte": day_start, "$lte": day_end}
                }
            }
            if device_id:
                match_stage["$match"]["device_id"] = device_id

            pipeline = [
                match_stage,
                {
                    "$group": {
                        "_id": "$device_id",
                        "total_readings": {"$sum": 1},

                        "avg_temperature": {"$avg": "$temperature_c"},
                        "min_temperature": {"$min": "$temperature_c"},
                        "max_temperature": {"$max": "$temperature_c"},

                        "avg_humidity":    {"$avg": "$humidity_pct"},
                        "min_humidity":    {"$min": "$humidity_pct"},
                        "max_humidity":    {"$max": "$humidity_pct"},

                        "avg_moisture":    {"$avg": "$soil_moisture_pct"},
                        "min_moisture":    {"$min": "$soil_moisture_pct"},
                        "max_moisture":    {"$max": "$soil_moisture_pct"},

                        "avg_ph":          {"$avg": "$ph_value"},
                        "min_ph":          {"$min": "$ph_value"},
                        "max_ph":          {"$max": "$ph_value"},

                        "first_reading":   {"$min": "$received_at"},
                        "last_reading":    {"$max": "$received_at"},
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "device_id":      "$_id",
                        "date":           day_start.strftime("%Y-%m-%d"),
                        "total_readings": 1,

                        "temperature": {
                            "avg": {"$round": ["$avg_temperature", 2]},
                            "min": {"$round": ["$min_temperature", 2]},
                            "max": {"$round": ["$max_temperature", 2]},
                        },
                        "humidity": {
                            "avg": {"$round": ["$avg_humidity", 2]},
                            "min": {"$round": ["$min_humidity", 2]},
                            "max": {"$round": ["$max_humidity", 2]},
                        },
                        "soil_moisture": {
                            "avg": {"$round": ["$avg_moisture", 2]},
                            "min": {"$round": ["$min_moisture", 2]},
                            "max": {"$round": ["$max_moisture", 2]},
                        },
                        "ph": {
                            "avg": {"$round": ["$avg_ph", 2]},
                            "min": {"$round": ["$min_ph", 2]},
                            "max": {"$round": ["$max_ph", 2]},
                        },
                        "first_reading": 1,
                        "last_reading":  1,
                    }
                }
            ]

            results = await collection.aggregate(pipeline).to_list(length=10)
            return results[0] if results else None

        except Exception as e:
            logger.error(f"[Repository] get_daily_summary failed: {e}")
            return None

    async def count_readings(self, device_id: Optional[str] = None) -> int:
        """Returns total number of readings stored in the database."""
        collection = self._collection
        if collection is None:
            return 0
        try:
            query = {"device_id": device_id} if device_id else {}
            return await collection.count_documents(query)
        except Exception as e:
            logger.error(f"[Repository] count_readings failed: {e}")
            return 0


# Single instance used across the application
sensor_repository = SensorRepository()
