# =============================================================
# app/database/mongodb.py — MongoDB Connection Manager
#
# Uses Motor — the async MongoDB driver designed for FastAPI.
# Motor never blocks the event loop, so all reads/writes happen
# without stalling other API requests.
#
# Pattern used: Module-level client instance created once at
# startup and reused for the entire application lifetime.
# This is the recommended Motor pattern — creating a new client
# per request is wasteful and slow.
# =============================================================

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.core.settings import settings

logger = logging.getLogger(__name__)

# ── Module-level client (one instance for entire app lifetime) ─
_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    """
    Creates the Motor client and verifies the connection by
    sending a ping to the server. Called once at app startup
    inside the FastAPI lifespan function.
    """
    global _client, _database

    logger.info(f"[MongoDB] Connecting to {settings.MONGO_URI}...")

    try:
        _client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,   # fail fast if unreachable
            connectTimeoutMS=5000,
        )

        # Verify connection is actually alive
        await _client.admin.command("ping")

        _database = _client[settings.MONGO_DB_NAME]

        logger.info(f"[MongoDB] Connected successfully.")
        logger.info(f"[MongoDB] Using database: '{settings.MONGO_DB_NAME}'")

        # Create indexes for efficient querying
        await _create_indexes()

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"[MongoDB] Connection failed: {e}")
        logger.error("[MongoDB] Is MongoDB running? Run: mongod")
        logger.error("[MongoDB] Falling back to in-memory storage only.")
        _client = None
        _database = None


async def close_mongo_connection() -> None:
    """
    Closes the Motor client. Called once at app shutdown
    inside the FastAPI lifespan function.
    """
    global _client, _database

    if _client:
        _client.close()
        _client = None
        _database = None
        logger.info("[MongoDB] Connection closed.")


def get_database() -> Optional[AsyncIOMotorDatabase]:
    """
    Returns the active database instance.
    Returns None if MongoDB is unavailable (graceful degradation).
    """
    return _database


def is_connected() -> bool:
    """Returns True if MongoDB is connected and ready."""
    return _database is not None


async def _create_indexes() -> None:
    """
    Creates indexes on the sensor_readings collection.
    Indexes dramatically speed up common queries like:
      - Fetching latest N readings
      - Filtering by device_id
      - Querying readings within a time range
    MongoDB skips index creation if they already exist — safe to
    call every startup.
    """
    if _database is None:
        return

    collection = _database[settings.MONGO_COLLECTION_READINGS]

    # Index 1: received_at descending — for "get latest N readings"
    await collection.create_index(
        [("received_at", DESCENDING)],
        name="idx_received_at_desc"
    )

    # Index 2: device_id + received_at — for device-specific queries
    await collection.create_index(
        [("device_id", ASCENDING), ("received_at", DESCENDING)],
        name="idx_device_received"
    )

    # Index 3: TTL index — auto-delete readings older than 90 days
    # MongoDB runs a background job to clean old data automatically.
    # expireAfterSeconds=7776000 → 90 days
    await collection.create_index(
        [("received_at", ASCENDING)],
        name="idx_ttl_90days",
        expireAfterSeconds=7_776_000
    )

    logger.info("[MongoDB] Indexes verified/created on 'sensor_readings'.")
