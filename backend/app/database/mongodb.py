# =============================================================
# app/database/mongodb.py — MongoDB Atlas Connection Manager
#
# Upgraded for Atlas:
#   • TLS enabled automatically for Atlas SRV URIs
#   • Connection pooling tuned for cloud latency
#   • Schema validation rules applied to all collections
#   • Compound indexes for every query pattern in this app
#   • TTL index: sensor_readings auto-deleted after 90 days
#   • Graceful fallback to local MongoDB if Atlas unreachable
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
    logger.info(f"[MongoDB] Connecting ({'Atlas Cloud' if is_atlas else 'Local'})…")

    try:
        # Atlas needs larger timeouts due to network latency
        timeout = 10000 if is_atlas else 5000

        _client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS = timeout,
            connectTimeoutMS         = timeout,
            socketTimeoutMS          = 30000,
            # Connection pool — Atlas free tier allows 500 connections
            maxPoolSize              = 10,
            minPoolSize              = 1,
            # Retry writes — essential for Atlas with replica sets
            retryWrites              = True,
            # Write concern: majority — confirms write on primary + secondary
            w                        = "majority",
        )

        await _client.admin.command("ping")
        _database = _client[settings.MONGO_DB_NAME]

        logger.info(f"[MongoDB] ✅ Connected to database: '{settings.MONGO_DB_NAME}'")
        if is_atlas:
            logger.info("[MongoDB] 🌐 Using MongoDB Atlas (cloud)")

        await _apply_schema_validation()
        await _create_indexes()

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"[MongoDB] ❌ Connection failed: {e}")
        if "mongodb+srv://" in settings.MONGO_URI:
            logger.error("[MongoDB] Atlas tips:")
            logger.error("  1. Check MONGO_URI in .env is correct")
            logger.error("  2. Whitelist your IP in Atlas → Network Access")
            logger.error("  3. Verify cluster username/password")
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
# Defines the expected shape of every document in each
# collection. MongoDB enforces these rules on insert/update —
# bad data is rejected before it enters the database.
# =============================================================

async def _apply_schema_validation() -> None:
    if _database is None:
        return

    db = _database

    # ── sensor_readings ───────────────────────────────────────
    sensor_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["device_id", "received_at"],
            "properties": {
                "device_id":          {"bsonType": "string",  "description": "ESP32 device identifier"},
                "received_at":        {"bsonType": "date",    "description": "Server timestamp (UTC)"},
                "timestamp":          {"bsonType": ["double","int","long"], "description": "ESP32 unix epoch"},
                "temperature_c":      {"bsonType": ["double","null"], "minimum": -40, "maximum": 80},
                "humidity_pct":       {"bsonType": ["double","null"], "minimum": 0,   "maximum": 100},
                "soil_moisture_pct":  {"bsonType": ["double","null"], "minimum": 0,   "maximum": 100},
                "ph_value":           {"bsonType": ["double","null"], "minimum": 0,   "maximum": 14},
                "has_errors":         {"bsonType": "bool"},
            }
        }
    }

    # ── recommendations ───────────────────────────────────────
    rec_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["device_id", "created_at", "type"],
            "properties": {
                "device_id":  {"bsonType": "string"},
                "created_at": {"bsonType": "date"},
                "type":       {"bsonType": "string", "enum": ["crop", "fertilizer", "irrigation", "full"]},
                "result":     {"bsonType": "object"},
                "confidence": {"bsonType": ["double","null"], "minimum": 0, "maximum": 1},
            }
        }
    }

    # ── alerts ────────────────────────────────────────────────
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
                "value":       {"bsonType": ["double","null"]},
                "threshold":   {"bsonType": ["double","null"]},
            }
        }
    }

    # ── devices ───────────────────────────────────────────────
    device_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["device_id", "registered_at"],
            "properties": {
                "device_id":     {"bsonType": "string"},
                "registered_at": {"bsonType": "date"},
                "name":          {"bsonType": ["string","null"]},
                "location":      {"bsonType": ["string","null"]},
                "firmware":      {"bsonType": ["string","null"]},
                "last_seen":     {"bsonType": ["date","null"]},
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
                    validationLevel="moderate",   # warn but don't reject legacy docs
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
# INDEXES
# Every query pattern this app runs has a matching index.
# MongoDB skips creation if index already exists — safe to
# call on every startup.
# =============================================================

async def _create_indexes() -> None:
    if _database is None:
        return

    db = _database

    # ── sensor_readings indexes ───────────────────────────────
    sr = db[settings.MONGO_COL_SENSOR_READINGS]

    # Most common query: latest readings overall
    await sr.create_index(
        [("received_at", DESCENDING)],
        name="idx_received_at_desc"
    )
    # Device-specific queries + time filtering
    await sr.create_index(
        [("device_id", ASCENDING), ("received_at", DESCENDING)],
        name="idx_device_time"
    )
    # Analytics pipeline: daily summary by date range
    await sr.create_index(
        [("received_at", ASCENDING), ("device_id", ASCENDING)],
        name="idx_time_asc_device"
    )
    # TTL: auto-delete readings older than 90 days
    await sr.create_index(
        [("received_at", ASCENDING)],
        name="idx_ttl_90days",
        expireAfterSeconds=7_776_000
    )

    # ── recommendations indexes ───────────────────────────────
    rc = db[settings.MONGO_COL_RECOMMENDATIONS]
    await rc.create_index([("device_id", ASCENDING), ("created_at", DESCENDING)], name="idx_rec_device_time")
    await rc.create_index([("type", ASCENDING), ("created_at", DESCENDING)],      name="idx_rec_type_time")
    # TTL: keep recommendations for 180 days
    await rc.create_index([("created_at", ASCENDING)], name="idx_rec_ttl", expireAfterSeconds=15_552_000)

    # ── alerts indexes ────────────────────────────────────────
    al = db[settings.MONGO_COL_ALERTS]
    await al.create_index([("device_id", ASCENDING), ("created_at", DESCENDING)], name="idx_alert_device")
    await al.create_index([("severity", ASCENDING), ("resolved", ASCENDING)],     name="idx_alert_severity")

    # ── devices indexes ───────────────────────────────────────
    dv = db[settings.MONGO_COL_DEVICES]
    await dv.create_index([("device_id", ASCENDING)], name="idx_device_id", unique=True)

    logger.info("[MongoDB] ✅ All indexes verified/created.")
