# =============================================================
# app/services/weather_service.py — OpenWeatherMap Integration
#
# Fetches current weather data for the configured city and
# caches the result in memory for WEATHER_CACHE_TTL seconds
# (default 10 min) to avoid hammering the free API quota.
#
# Free tier: 1,000 calls/day — with 10min caching we use
# at most 144 calls/day, well within limits.
#
# Data fetched and used by ML models:
#   - temperature_c     (outside air temp)
#   - humidity_pct      (outside relative humidity)
#   - rainfall_mm       (rain in last 3 hours)
#   - weather_condition (clear, rain, clouds, etc.)
#   - wind_speed_ms     (wind speed m/s)
# =============================================================

import logging
import time
from typing import Optional

import httpx

from app.core.settings import settings

logger = logging.getLogger(__name__)

# ── OpenWeatherMap API ────────────────────────────────────────
OWM_BASE_URL     = "https://api.openweathermap.org/data/2.5"
OWM_CURRENT_URL  = f"{OWM_BASE_URL}/weather"
OWM_FORECAST_URL = f"{OWM_BASE_URL}/forecast"


class WeatherData:
    """
    Holds one snapshot of weather data fetched from OpenWeatherMap.
    All fields have safe defaults so ML models never crash on missing data.
    """
    def __init__(self, raw: dict):
        main     = raw.get("main", {})
        wind     = raw.get("wind", {})
        rain     = raw.get("rain", {})
        weather  = raw.get("weather", [{}])
        clouds   = raw.get("clouds", {})
        sys_data = raw.get("sys", {})

        self.city:              str   = raw.get("name", settings.WEATHER_CITY)
        self.country:           str   = sys_data.get("country", settings.WEATHER_COUNTRY_CODE)
        self.temperature_c:     float = round(main.get("temp", 25.0) - 273.15, 2)   # K→°C
        self.feels_like_c:      float = round(main.get("feels_like", 25.0) - 273.15, 2)
        self.temp_min_c:        float = round(main.get("temp_min", 20.0) - 273.15, 2)
        self.temp_max_c:        float = round(main.get("temp_max", 30.0) - 273.15, 2)
        self.humidity_pct:      float = float(main.get("humidity", 60.0))
        self.pressure_hpa:      float = float(main.get("pressure", 1013.0))
        self.wind_speed_ms:     float = float(wind.get("speed", 0.0))
        self.wind_deg:          int   = int(wind.get("deg", 0))
        self.cloudiness_pct:    int   = int(clouds.get("all", 0))

        # Rain — OWM gives rain in last 1h or 3h
        self.rainfall_1h_mm:    float = float(rain.get("1h", 0.0))
        self.rainfall_3h_mm:    float = float(rain.get("3h", 0.0))

        # Weather condition description
        self.condition_id:      int   = int(weather[0].get("id", 800))
        self.condition_main:    str   = weather[0].get("main", "Clear")
        self.condition_desc:    str   = weather[0].get("description", "clear sky")
        self.condition_icon:    str   = weather[0].get("icon", "01d")

        # Derived: estimated seasonal rainfall (mm) for ML model
        # OpenWeatherMap doesn't give monthly rainfall directly —
        # we estimate from 3h rain × 240 (hours in a month / 3)
        self.rainfall_monthly_mm: float = round(self.rainfall_3h_mm * 240, 1)

        self.fetched_at: float = time.time()

    def to_dict(self) -> dict:
        return {
            "city":               self.city,
            "country":            self.country,
            "temperature_c":      self.temperature_c,
            "feels_like_c":       self.feels_like_c,
            "temp_min_c":         self.temp_min_c,
            "temp_max_c":         self.temp_max_c,
            "humidity_pct":       self.humidity_pct,
            "pressure_hpa":       self.pressure_hpa,
            "wind_speed_ms":      self.wind_speed_ms,
            "cloudiness_pct":     self.cloudiness_pct,
            "rainfall_1h_mm":     self.rainfall_1h_mm,
            "rainfall_3h_mm":     self.rainfall_3h_mm,
            "rainfall_monthly_mm": self.rainfall_monthly_mm,
            "condition_main":     self.condition_main,
            "condition_desc":     self.condition_desc,
            "condition_icon":     self.condition_icon,
            "fetched_at":         self.fetched_at,
        }


class WeatherService:
    """
    Async service that fetches weather from OpenWeatherMap
    and caches results to minimise API calls.
    """

    def __init__(self):
        self._cache:          Optional[WeatherData] = None
        self._cache_time:     float                 = 0.0
        self._api_configured: bool                  = bool(settings.WEATHER_API_KEY)

    def is_configured(self) -> bool:
        """Returns True if an API key is set in .env"""
        return self._api_configured

    def _is_cache_valid(self) -> bool:
        """Returns True if cached data is still fresh."""
        return (
            self._cache is not None and
            (time.time() - self._cache_time) < settings.WEATHER_CACHE_TTL
        )

    async def get_current_weather(self) -> Optional[WeatherData]:
        """
        Returns current weather for the configured city.
        Uses cached data if still fresh, otherwise fetches from API.

        Returns None if API key is not configured or fetch fails.
        """
        if not self._api_configured:
            logger.debug("[Weather] API key not configured — skipping fetch.")
            return None

        if self._is_cache_valid():
            logger.debug("[Weather] Returning cached weather data.")
            return self._cache

        return await self._fetch_and_cache()

    async def _fetch_and_cache(self) -> Optional[WeatherData]:
        """Makes the actual HTTP request to OpenWeatherMap."""
        params = {
            "q":     f"{settings.WEATHER_CITY},{settings.WEATHER_COUNTRY_CODE}",
            "appid": settings.WEATHER_API_KEY,
            "units": "standard",   # Kelvin — we convert to Celsius ourselves
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(OWM_CURRENT_URL, params=params)
                response.raise_for_status()
                raw = response.json()

            weather = WeatherData(raw)
            self._cache      = weather
            self._cache_time = time.time()

            logger.info(
                f"[Weather] Fetched: {weather.city} — "
                f"{weather.temperature_c}°C, "
                f"{weather.humidity_pct}% humidity, "
                f"{weather.condition_desc}"
            )
            return weather

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                logger.error("[Weather] Invalid API key. Check WEATHER_API_KEY in .env")
            elif e.response.status_code == 404:
                logger.error(f"[Weather] City '{settings.WEATHER_CITY}' not found. "
                             "Check WEATHER_CITY in .env")
            else:
                logger.error(f"[Weather] HTTP error: {e}")
            return self._cache   # return stale cache rather than None

        except httpx.TimeoutException:
            logger.warning("[Weather] Request timed out — using cached data.")
            return self._cache

        except Exception as e:
            logger.error(f"[Weather] Unexpected error: {e}")
            return self._cache

    def get_cached(self) -> Optional[WeatherData]:
        """Returns whatever is in cache (may be stale). Never makes HTTP call."""
        return self._cache


# Single instance — shared across the entire application
weather_service = WeatherService()
