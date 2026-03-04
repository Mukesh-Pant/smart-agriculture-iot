# =============================================================
# app/main.py — FastAPI Application Entry Point
#
# This file:
#   - Creates the FastAPI app instance
#   - Manages startup/shutdown lifecycle (MQTT start/stop)
#   - Registers all API routers
#   - Configures CORS for future frontend access
#   - Serves a root health-check endpoint
# =============================================================

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings
from app.routes.sensor_routes import router as sensor_router
from app.services.mqtt_service import mqtt_service

# ── Logging Configuration ─────────────────────────────────────
logging.basicConfig(
    level   = logging.INFO if settings.APP_DEBUG else logging.WARNING,
    format  = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


# ── Lifespan: Startup & Shutdown ──────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Code before `yield` runs on startup.
    Code after `yield` runs on shutdown.
    This replaces the deprecated @app.on_event("startup") pattern.
    """
    # ── STARTUP ───────────────────────────────────────────────
    logger.info("=" * 55)
    logger.info("  Smart Agriculture Backend Starting Up")
    logger.info(f"  Version : {settings.APP_VERSION}")
    logger.info(f"  Debug   : {settings.APP_DEBUG}")
    logger.info("=" * 55)

    logger.info("[APP] Starting MQTT subscriber service...")
    mqtt_service.start()
    logger.info("[APP] MQTT service running — waiting for ESP32 data.")
    logger.info(f"[APP] API docs available at: http://localhost:{settings.APP_PORT}/docs")

    yield  # ← Application runs here

    # ── SHUTDOWN ──────────────────────────────────────────────
    logger.info("[APP] Shutting down — stopping MQTT service...")
    mqtt_service.stop()
    logger.info("[APP] Shutdown complete.")


# ── FastAPI App Instance ──────────────────────────────────────
app = FastAPI(
    title       = settings.APP_TITLE,
    version     = settings.APP_VERSION,
    description = (
        "Backend API for the IoT-Based Smart Agriculture Monitoring System. "
        "Receives real-time sensor data from ESP32 via MQTT and exposes "
        "REST endpoints for the farmer dashboard."
    ),
    lifespan    = lifespan,
    docs_url    = "/docs",      # Swagger UI
    redoc_url   = "/redoc",     # ReDoc UI
)


# ── CORS Middleware ───────────────────────────────────────────
# Allows the React frontend (running on different port) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],     # Restrict to specific domain in production
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)


# ── Register Routers ──────────────────────────────────────────
app.include_router(sensor_router)


# ── Root Endpoint ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """Root health-check endpoint — confirms the server is running."""
    return {
        "message": "Smart Agriculture API is running",
        "version": settings.APP_VERSION,
        "docs":    "/docs",
        "status":  "ok"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Lightweight health check for monitoring."""
    return {"status": "healthy"}
