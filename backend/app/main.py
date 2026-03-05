# =============================================================
# app/main.py — FastAPI Application Entry Point
# =============================================================

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings
from app.routes.sensor_routes        import router as sensor_router
from app.routes.analytics_routes     import router as analytics_router
from app.routes.weather_routes       import router as weather_router
from app.routes.recommendation_routes import router as recommendation_router
from app.services.mqtt_service       import mqtt_service, set_event_loop
from app.services.ml_service         import ml_service
from app.services.weather_service    import weather_service
from app.database.mongodb            import connect_to_mongo, close_mongo_connection

logging.basicConfig(
    level   = logging.INFO if settings.APP_DEBUG else logging.WARNING,
    format  = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ───────────────────────────────────────────────
    logger.info("=" * 55)
    logger.info("  Smart Agriculture Backend — Phase 4")
    logger.info(f"  Version : {settings.APP_VERSION}")
    logger.info("=" * 55)

    # 1. Connect MongoDB
    await connect_to_mongo()

    # 2. Register event loop for MQTT→MongoDB bridge
    loop = asyncio.get_running_loop()
    set_event_loop(loop)

    # 3. Start MQTT subscriber
    logger.info("[APP] Starting MQTT subscriber service...")
    mqtt_service.start()

    # 4. Load ML models (synchronous — runs in startup thread)
    logger.info("[APP] Loading ML recommendation models...")
    ml_service.load_all_models()

    # 5. Warm up weather cache (fetch once at startup)
    if weather_service.is_configured():
        logger.info("[APP] Warming up weather cache...")
        await weather_service.get_current_weather()
    else:
        logger.info(
            "[APP] Weather API not configured. "
            "Add WEATHER_API_KEY to .env to enable weather integration."
        )

    logger.info(f"[APP] API docs → http://localhost:{settings.APP_PORT}/docs")
    logger.info("[APP] Ready to serve requests.")

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
        "IoT-Based Smart Agriculture Monitoring & Decision Support System. "
        "Collects real-time sensor data via MQTT, stores in MongoDB, "
        "integrates live weather data, and provides ML-powered crop, "
        "fertilizer, and irrigation recommendations."
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
app.include_router(weather_router)
app.include_router(recommendation_router)


# ── Health ────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "message":  "Smart Agriculture API is running",
        "version":  settings.APP_VERSION,
        "docs":     "/docs",
        "status":   "ok"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    from app.database.mongodb import is_connected
    return {
        "status":            "healthy",
        "mongodb":           "connected" if is_connected() else "disconnected",
        "mqtt":              "running",
        "ml_models":         "loaded" if ml_service.is_ready() else "not loaded",
        "weather_api":       "configured" if weather_service.is_configured() else "not configured",
    }
