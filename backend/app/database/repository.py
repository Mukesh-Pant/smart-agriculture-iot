# =============================================================
# app/database/repository.py — Data Repository Layer
#
# Additions in this upgrade:
#   • RecommendationRepository — saves ML predictions to Atlas
#   • AlertRepository          — logs threshold breach alerts
#   • DeviceRepository         — registers / updates device info
#   • SensorRepository         — unchanged API, new collection name
# =============================================================

import logging
import random
import string
from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import DESCENDING, ASCENDING

from app.core.settings import settings
from app.database.mongodb import get_database
from app.models.sensor_data import SensorReadingResponse

logger = logging.getLogger(__name__)


def _serialize(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


# =============================================================
# SENSOR REPOSITORY  (unchanged public API)
# =============================================================

class SensorRepository:

    @property
    def _col(self):
        db = get_database()
        return db[settings.MONGO_COL_SENSOR_READINGS] if db is not None else None

    async def save_reading(self, reading: SensorReadingResponse) -> Optional[str]:
        if self._col is None:
            return None
        try:
            doc = reading.model_dump(exclude_none=True)
            doc.pop("id", None)
            if isinstance(doc.get("received_at"), str):
                doc["received_at"] = datetime.fromisoformat(doc["received_at"])
            if "sensor_status" in doc and doc["sensor_status"]:
                doc["sensor_status"] = dict(doc["sensor_status"])
            result = await self._col.insert_one(doc)
            inserted_id = str(result.inserted_id)
            logger.debug(f"[Repository] Saved reading → {inserted_id}")

            # Also upsert device last_seen
            await device_repository.update_last_seen(reading.device_id)

            return inserted_id
        except Exception as e:
            logger.error(f"[Repository] save_reading failed: {e}")
            return None

    async def get_latest(self, device_id: Optional[str] = None) -> Optional[dict]:
        if self._col is None:
            return None
        try:
            q = {"device_id": device_id} if device_id else {}
            doc = await self._col.find_one(q, sort=[("received_at", DESCENDING)])
            return _serialize(doc) if doc else None
        except Exception as e:
            logger.error(f"[Repository] get_latest failed: {e}")
            return None

    async def get_history(self, limit=50, skip=0, device_id=None) -> list:
        if self._col is None:
            return []
        try:
            q = {"device_id": device_id} if device_id else {}
            cursor = self._col.find(q).sort("received_at", DESCENDING).skip(skip).limit(min(limit, 500))
            docs = await cursor.to_list(length=min(limit, 500))
            return [_serialize(d) for d in docs]
        except Exception as e:
            logger.error(f"[Repository] get_history failed: {e}")
            return []

    async def get_by_id(self, reading_id: str) -> Optional[dict]:
        if self._col is None:
            return None
        try:
            doc = await self._col.find_one({"_id": ObjectId(reading_id)})
            return _serialize(doc) if doc else None
        except (InvalidId, Exception) as e:
            logger.error(f"[Repository] get_by_id failed: {e}")
            return None

    async def get_range(self, start, end, device_id=None, limit=500) -> list:
        if self._col is None:
            return []
        try:
            q = {"received_at": {"$gte": start, "$lte": end}}
            if device_id:
                q["device_id"] = device_id
            cursor = self._col.find(q).sort("received_at", DESCENDING).limit(min(limit, 500))
            docs = await cursor.to_list(length=min(limit, 500))
            return [_serialize(d) for d in docs]
        except Exception as e:
            logger.error(f"[Repository] get_range failed: {e}")
            return []

    async def get_daily_summary(self, date=None, device_id=None) -> Optional[dict]:
        if self._col is None:
            return None
        try:
            if date is None:
                date = datetime.utcnow()
            day_start = date.replace(hour=0,  minute=0,  second=0,  microsecond=0)
            day_end   = date.replace(hour=23, minute=59, second=59, microsecond=999999)

            match = {"$match": {"received_at": {"$gte": day_start, "$lte": day_end}}}
            if device_id:
                match["$match"]["device_id"] = device_id

            pipeline = [
                match,
                {"$group": {
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
                }},
                {"$project": {
                    "_id": 0,
                    "device_id": "$_id",
                    "date": day_start.strftime("%Y-%m-%d"),
                    "total_readings": 1,
                    "temperature":   {"avg": {"$round": ["$avg_temperature", 2]}, "min": {"$round": ["$min_temperature", 2]}, "max": {"$round": ["$max_temperature", 2]}},
                    "humidity":      {"avg": {"$round": ["$avg_humidity",    2]}, "min": {"$round": ["$min_humidity",    2]}, "max": {"$round": ["$max_humidity",    2]}},
                    "soil_moisture": {"avg": {"$round": ["$avg_moisture",    2]}, "min": {"$round": ["$min_moisture",    2]}, "max": {"$round": ["$max_moisture",    2]}},
                    "ph":            {"avg": {"$round": ["$avg_ph",          2]}, "min": {"$round": ["$min_ph",          2]}, "max": {"$round": ["$max_ph",          2]}},
                    "first_reading": 1, "last_reading": 1,
                }}
            ]
            results = await self._col.aggregate(pipeline).to_list(length=10)
            return results[0] if results else None
        except Exception as e:
            logger.error(f"[Repository] get_daily_summary failed: {e}")
            return None

    async def count_readings(self, device_id=None) -> int:
        if self._col is None:
            return 0
        try:
            q = {"device_id": device_id} if device_id else {}
            return await self._col.count_documents(q)
        except Exception as e:
            logger.error(f"[Repository] count_readings failed: {e}")
            return 0


# =============================================================
# RECOMMENDATION REPOSITORY
# Persists every ML prediction so supervisors and teammates
# can review historical recommendations in Atlas.
# =============================================================

class RecommendationRepository:

    @property
    def _col(self):
        db = get_database()
        return db[settings.MONGO_COL_RECOMMENDATIONS] if db is not None else None

    @staticmethod
    def _make_report_id() -> str:
        date_part = datetime.utcnow().strftime("%Y%m%d")
        rand_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"AGS-{date_part}-{rand_part}"

    async def save(
        self,
        device_id:    str,
        rec_type:     str,
        result:       dict,
        confidence:   Optional[float] = None,
        user_id:      Optional[str]   = None,
        advice_en:    Optional[str]   = None,
        advice_np:    Optional[str]   = None,
        advice_source: Optional[str] = None,
    ) -> Optional[str]:
        if self._col is None:
            return None
        try:
            doc = {
                "device_id":     device_id,
                "user_id":       user_id,
                "report_id":     self._make_report_id(),
                "created_at":    datetime.utcnow(),
                "type":          rec_type,
                "result":        result,
                "confidence":    confidence,
                "advice_en":     advice_en,
                "advice_np":     advice_np,
                "advice_source": advice_source,
                "pdf_generated": False,
            }
            res = await self._col.insert_one(doc)
            return str(res.inserted_id)
        except Exception as e:
            logger.error(f"[RecommendationRepo] save failed: {e}")
            return None

    async def get_recent(self, device_id: str, rec_type: str = None, limit: int = 10) -> list:
        if self._col is None:
            return []
        try:
            q = {"device_id": device_id}
            if rec_type:
                q["type"] = rec_type
            cursor = self._col.find(q).sort("created_at", DESCENDING).limit(limit)
            docs = await cursor.to_list(length=limit)
            return [_serialize(d) for d in docs]
        except Exception as e:
            logger.error(f"[RecommendationRepo] get_recent failed: {e}")
            return []

    async def get_recommendation_history(
        self, query: dict = None, skip: int = 0, limit: int = 20
    ) -> list:
        if self._col is None:
            return []
        try:
            q = query or {}
            cursor = (
                self._col.find(q)
                .sort("created_at", DESCENDING)
                .skip(skip)
                .limit(limit)
            )
            docs = await cursor.to_list(length=limit)
            return [_serialize(d) for d in docs]
        except Exception as e:
            logger.error(f"[RecommendationRepo] get_history failed: {e}")
            return []

    async def count_recommendations(self, query: dict = None) -> int:
        if self._col is None:
            return 0
        try:
            return await self._col.count_documents(query or {})
        except Exception as e:
            logger.error(f"[RecommendationRepo] count failed: {e}")
            return 0

    async def get_recommendation_by_report_id(self, report_id: str) -> Optional[dict]:
        if self._col is None:
            return None
        try:
            doc = await self._col.find_one({"report_id": report_id})
            return _serialize(doc) if doc else None
        except Exception as e:
            logger.error(f"[RecommendationRepo] get_by_report_id failed: {e}")
            return None

    async def save_full_report(self, report_data: dict) -> Optional[str]:
        """Save a complete 4-section report and return the AGS-formatted report_id."""
        if self._col is None:
            return None
        try:
            report_id = self._make_report_id()
            doc = {
                "report_id":  report_id,
                "created_at": datetime.utcnow(),
                "type":       "complete",
                **report_data,
            }
            await self._col.insert_one(doc)
            logger.info(f"[RecommendationRepo] Full report saved: {report_id}")
            return report_id
        except Exception as e:
            logger.error(f"[RecommendationRepo] save_full_report failed: {e}")
            return None


# =============================================================
# ALERT REPOSITORY
# =============================================================

class AlertRepository:

    @property
    def _col(self):
        db = get_database()
        return db[settings.MONGO_COL_ALERTS] if db is not None else None

    async def create_alert(
        self,
        device_id:  str,
        alert_type: str,
        message:    str,
        severity:   str = "warning",   # info | warning | critical
        value:      Optional[float] = None,
        threshold:  Optional[float] = None,
    ) -> Optional[str]:
        if self._col is None:
            return None
        try:
            doc = {
                "device_id":  device_id,
                "created_at": datetime.utcnow(),
                "alert_type": alert_type,
                "severity":   severity,
                "message":    message,
                "value":      value,
                "threshold":  threshold,
                "resolved":   False,
            }
            res = await self._col.insert_one(doc)
            logger.info(f"[AlertRepo] {severity.upper()} alert created: {alert_type}")
            return str(res.inserted_id)
        except Exception as e:
            logger.error(f"[AlertRepo] create_alert failed: {e}")
            return None

    async def get_active(self, device_id: str = None, limit: int = 20) -> list:
        if self._col is None:
            return []
        try:
            q = {"resolved": False}
            if device_id:
                q["device_id"] = device_id
            cursor = self._col.find(q).sort("created_at", DESCENDING).limit(limit)
            docs = await cursor.to_list(length=limit)
            return [_serialize(d) for d in docs]
        except Exception as e:
            logger.error(f"[AlertRepo] get_active failed: {e}")
            return []

    async def resolve(self, alert_id: str) -> bool:
        if self._col is None:
            return False
        try:
            res = await self._col.update_one(
                {"_id": ObjectId(alert_id)},
                {"$set": {"resolved": True, "resolved_at": datetime.utcnow()}}
            )
            return res.modified_count > 0
        except Exception as e:
            logger.error(f"[AlertRepo] resolve failed: {e}")
            return False


# =============================================================
# DEVICE REPOSITORY
# =============================================================

class DeviceRepository:

    @property
    def _col(self):
        db = get_database()
        return db[settings.MONGO_COL_DEVICES] if db is not None else None

    async def update_last_seen(self, device_id: str) -> None:
        """Upserts a device record every time it sends a reading."""
        if self._col is None:
            return
        try:
            await self._col.update_one(
                {"device_id": device_id},
                {"$set":     {"last_seen": datetime.utcnow(), "active": True},
                 "$setOnInsert": {"device_id": device_id, "registered_at": datetime.utcnow()}},
                upsert=True
            )
        except Exception as e:
            logger.error(f"[DeviceRepo] update_last_seen failed: {e}")

    async def get_all(self) -> list:
        if self._col is None:
            return []
        try:
            docs = await self._col.find().sort("last_seen", DESCENDING).to_list(length=100)
            return [_serialize(d) for d in docs]
        except Exception as e:
            logger.error(f"[DeviceRepo] get_all failed: {e}")
            return []


# ── Single instances ──────────────────────────────────────────
sensor_repository         = SensorRepository()
recommendation_repository = RecommendationRepository()
alert_repository          = AlertRepository()
device_repository         = DeviceRepository()

# Unified facade used by recommendation_routes
repository = recommendation_repository
