# =============================================================
# app/database/mongodb.py — MongoDB Atlas Connection Manager
# =============================================================

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, OperationFailure

from app.core.settings import settings

logger = logging.getLogger(__name__)

_client:   Optional[AsyncIOMotorClient]   = None
_database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    global _client, _database

    is_atlas = "mongodb+srv://" in settings.MONGO_URI
    logger.info(f"[MongoDB] Connecting ({'Atlas Cloud' if is_atlas else 'Local'})...")

    try:
        timeout = 10000 if is_atlas else 5000

        _client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS = timeout,
            connectTimeoutMS         = timeout,
            socketTimeoutMS          = 30000,
            maxPoolSize              = 10,
            minPoolSize              = 1,
            retryWrites              = True,
            w                        = "majority",
        )

        await _client.admin.command("ping")
        _database = _client[settings.MONGO_DB_NAME]

        logger.info(f"[MongoDB] Connected successfully.")
        logger.info(f"[MongoDB] Using database: '{settings.MONGO_DB_NAME}'")
        if is_atlas:
            logger.info("[MongoDB] Using MongoDB Atlas (cloud)")

        await _apply_schema_validation()
        await _create_indexes()

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"[MongoDB] Connection failed: {e}")
        if "mongodb+srv://" in settings.MONGO_URI:
            logger.error("[MongoDB] Atlas tips: 1) Check URI  2) Whitelist IP in Atlas Network Access  3) Check password")
        _client = None
        _database = None


async def close_mongo_connection() -> None:
    global _client, _database
    if _client:
        _client.close()
        _client = None
        _database = None
        logger.info("[MongoDB] Connection closed.")


def get_database() -> Optional[AsyncIOMotorDatabase]:
    return _database


def is_connected() -> bool:
    return _database is not None


# =============================================================
# SCHEMA VALIDATION
# =============================================================

async def _apply_schema_validation() -> None:
    if _database is None:
        return

    db = _database

    sensor_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["device_id", "received_at"],
            "properties": {
                "device_id":          {"bsonType": "string"},
                "received_at":        {"bsonType": "date"},
                "temperature_c":      {"bsonType": ["double", "null"]},
                "humidity_pct":       {"bsonType": ["double", "null"]},
                "soil_moisture_pct":  {"bsonType": ["double", "null"]},
                "ph_value":           {"bsonType": ["double", "null"]},
                "has_errors":         {"bsonType": "bool"},
            }
        }
    }

    rec_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["device_id", "created_at", "type"],
            "properties": {
                "device_id":     {"bsonType": "string"},
                "user_id":       {"bsonType": ["string", "null"]},
                "report_id":     {"bsonType": ["string", "null"]},
                "created_at":    {"bsonType": "date"},
                "type":          {"bsonType": "string", "enum": ["crop", "fertilizer", "irrigation", "full", "soil"]},
                "result":        {"bsonType": "object"},
                "confidence":    {"bsonType": ["double", "null"]},
                "advice_en":     {"bsonType": ["string", "null"]},
                "advice_np":     {"bsonType": ["string", "null"]},
                "advice_source": {"bsonType": ["string", "null"]},
                "pdf_generated": {"bsonType": ["bool", "null"]},
            }
        }
    }

    alert_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["device_id", "created_at", "alert_type", "severity"],
            "properties": {
                "device_id":   {"bsonType": "string"},
                "created_at":  {"bsonType": "date"},
                "alert_type":  {"bsonType": "string"},
                "severity":    {"bsonType": "string", "enum": ["info", "warning", "critical"]},
                "message":     {"bsonType": "string"},
                "resolved":    {"bsonType": "bool"},
            }
        }
    }

    device_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["device_id", "registered_at"],
            "properties": {
                "device_id":     {"bsonType": "string"},
                "registered_at": {"bsonType": "date"},
                "last_seen":     {"bsonType": ["date", "null"]},
                "active":        {"bsonType": "bool"},
            }
        }
    }

    collections = {
        settings.MONGO_COL_SENSOR_READINGS: sensor_schema,
        settings.MONGO_COL_RECOMMENDATIONS: rec_schema,
        settings.MONGO_COL_ALERTS:          alert_schema,
        settings.MONGO_COL_DEVICES:         device_schema,
    }

    existing = await db.list_collection_names()

    for col_name, schema in collections.items():
        try:
            if col_name not in existing:
                await db.create_collection(
                    col_name,
                    validator=schema,
                    validationLevel="moderate",
                    validationAction="warn",
                )
                logger.info(f"[MongoDB] Created collection '{col_name}' with schema validation.")
            else:
                await db.command("collMod", col_name, validator=schema,
                                 validationLevel="moderate", validationAction="warn")
                logger.info(f"[MongoDB] Schema validation updated: '{col_name}'.")
        except OperationFailure as e:
            logger.warning(f"[MongoDB] Schema validation skipped for '{col_name}': {e}")


# =============================================================
# SAFE INDEX HELPER
# Never crashes startup — logs and skips on any conflict.
# =============================================================

async def _safe_create_index(collection, keys, name: str, **kwargs) -> None:
    """
    Creates an index only if no index with that name already exists.
    If the same key pattern exists under a different name (IndexOptionsConflict),
    this is logged as a warning but never raises — the app starts normally.
    """
    try:
        existing = await collection.index_information()
        if name in existing:
            return  # already present, skip silently
        await collection.create_index(keys, name=name, **kwargs)
    except OperationFailure as e:
        errmsg = e.details.get("errmsg", str(e)) if e.details else str(e)
        logger.warning(f"[MongoDB] Index '{name}' skipped (already exists under different name): {errmsg}")
    except Exception as e:
        logger.warning(f"[MongoDB] Index '{name}' skipped: {e}")


# =============================================================
# INDEXES
# Uses _safe_create_index everywhere — safe on every restart.
# Old index name 'idx_device_received' kept to match what
# was already created on Atlas by the previous mongodb.py.
# =============================================================

async def _create_indexes() -> None:
    if _database is None:
        return

    db = _database

    # ── sensor_readings ───────────────────────────────────────
    sr = db[settings.MONGO_COL_SENSOR_READINGS]
    # Keep original name to avoid IndexOptionsConflict on existing Atlas cluster
    await _safe_create_index(sr, [("received_at", DESCENDING)],                             name="idx_received_at_desc")
    await _safe_create_index(sr, [("device_id", ASCENDING), ("received_at", DESCENDING)],   name="idx_device_received")
    await _safe_create_index(sr, [("received_at", ASCENDING), ("device_id", ASCENDING)],    name="idx_time_asc_device")
    await _safe_create_index(sr, [("received_at", ASCENDING)], name="idx_ttl_90days",       expireAfterSeconds=7_776_000)

    # ── recommendations (no TTL — kept permanently for history) ─
    rc = db[settings.MONGO_COL_RECOMMENDATIONS]
    await _safe_create_index(rc, [("device_id", ASCENDING), ("created_at", DESCENDING)],    name="idx_rec_device_time")
    await _safe_create_index(rc, [("user_id", ASCENDING), ("created_at", DESCENDING)],      name="idx_rec_user_time")
    await _safe_create_index(rc, [("type", ASCENDING), ("created_at", DESCENDING)],         name="idx_rec_type_time")
    await _safe_create_index(rc, [("report_id", ASCENDING)], name="idx_rec_report_id",      unique=False)

    # ── alerts ────────────────────────────────────────────────
    al = db[settings.MONGO_COL_ALERTS]
    await _safe_create_index(al, [("device_id", ASCENDING), ("created_at", DESCENDING)],    name="idx_alert_device")
    await _safe_create_index(al, [("severity", ASCENDING), ("resolved", ASCENDING)],        name="idx_alert_severity")

    # ── devices ───────────────────────────────────────────────
    dv = db[settings.MONGO_COL_DEVICES]
    await _safe_create_index(dv, [("device_id", ASCENDING)], name="idx_device_id",          unique=True)

    logger.info("[MongoDB] All indexes verified/created.")
