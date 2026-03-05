# =============================================================
# app/routes/weather_routes.py — Weather Data Endpoints
#
# Endpoints:
#   GET /api/weather/current   → current weather for configured city
#   GET /api/weather/status    → API key configuration status
# =============================================================

import logging
from fastapi import APIRouter, HTTPException

from app.services.weather_service import weather_service
from app.models.recommendation import WeatherResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get(
    "/current",
    response_model=WeatherResponse,
    summary="Get current weather for the configured city"
)
async def get_current_weather():
    """
    Fetches real-time weather data from OpenWeatherMap for the city
    configured in WEATHER_CITY (.env). Results are cached for 10 minutes.

    Requires WEATHER_API_KEY to be set in .env.
    Get a free key at: https://openweathermap.org/api
    """
    if not weather_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "Weather API key not configured. "
                "Add WEATHER_API_KEY to your .env file. "
                "Get a free key at https://openweathermap.org/api"
            )
        )

    weather = await weather_service.get_current_weather()

    if weather is None:
        raise HTTPException(
            status_code=503,
            detail="Unable to fetch weather data. Check API key and city name."
        )

    return WeatherResponse(**weather.to_dict())


@router.get(
    "/status",
    summary="Check weather API configuration status"
)
async def get_weather_status():
    """Returns whether the Weather API is configured and working."""
    configured = weather_service.is_configured()
    cached     = weather_service.get_cached()

    return {
        "api_configured":  configured,
        "city":            f"{weather_service._WeatherService__dict.get('city', 'N/A')}"
                           if hasattr(weather_service, '__dict__') else "N/A",
        "last_fetched_at": cached.fetched_at if cached else None,
        "cache_valid":     weather_service._is_cache_valid(),
        "message": (
            "Weather API is ready." if configured
            else "Add WEATHER_API_KEY to .env to enable weather integration."
        )
    }
