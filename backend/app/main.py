# =============================================================
# app/main.py — FastAPI Application Entry Point
# =============================================================

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings
from app.routes.sensor_routes import router as sensor_router
from app.routes.analytics_routes import router as analytics_router
from app.services.mqtt_service import mqtt_service, set_event_loop
from app.database.mongodb import connect_to_mongo, close_mongo_connection

# ── Logging ───────────────────────────────────────────────────
logging.basicConfig(
    level   = logging.INFO if settings.APP_DEBUG else logging.WARNING,
    format  = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ───────────────────────────────────────────────
    logger.info("=" * 55)
    logger.info("  Smart Agriculture Backend Starting Up")
    logger.info(f"  Version : {settings.APP_VERSION}")
    logger.info("=" * 55)

    # 1. Connect to MongoDB
    await connect_to_mongo()

    # 2. Register the running event loop with the MQTT service
    #    so it can schedule async DB saves from its thread
    loop = asyncio.get_running_loop()
    set_event_loop(loop)

    # 3. Start MQTT subscriber
    logger.info("[APP] Starting MQTT subscriber service...")
    mqtt_service.start()

    logger.info(f"[APP] API docs → http://localhost:{settings.APP_PORT}/docs")

    yield  # ← Application runs here

    # ── SHUTDOWN ──────────────────────────────────────────────
    logger.info("[APP] Shutting down...")
    mqtt_service.stop()
    await close_mongo_connection()
    logger.info("[APP] Shutdown complete.")


# ── App Instance ──────────────────────────────────────────────
app = FastAPI(
    title       = settings.APP_TITLE,
    version     = settings.APP_VERSION,
    description = (
        "Backend API for the IoT-Based Smart Agriculture Monitoring System. "
        "Receives real-time sensor data from ESP32 via MQTT, persists to "
        "MongoDB, and exposes REST endpoints for the farmer dashboard."
    ),
    lifespan  = lifespan,
    docs_url  = "/docs",
    redoc_url = "/redoc",
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(sensor_router)
app.include_router(analytics_router)


# ── Health Endpoints ──────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Smart Agriculture API is running",
        "version": settings.APP_VERSION,
        "docs":    "/docs",
        "status":  "ok"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    from app.database.mongodb import is_connected
    return {
        "status":   "healthy",
        "mongodb":  "connected" if is_connected() else "disconnected",
        "mqtt":     "running"
    }
