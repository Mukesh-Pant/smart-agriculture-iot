# =============================================================
# sensors/soil_moisture_sensor.py — Resistive Soil Moisture Reader
# Reads raw ADC value and converts to a 0–100% moisture scale
# using calibration values defined in config.py.
# =============================================================

import machine
import config


class SoilMoistureSensor:
    """
    Reads soil moisture via ADC.

    The resistive sensor outputs HIGH voltage (dry) → LOW voltage (wet).
    Raw ADC range on ESP32 is 0–4095 (12-bit).
    We map this to 0% (dry) → 100% (wet) using calibration constants.

    IMPORTANT: GPIO 34 and 35 are INPUT ONLY on ESP32 — perfect for ADC.
    """

    def __init__(self):
        # Attenuation 11dB allows reading 0–3.6V (full sensor range)
        self._adc = machine.ADC(machine.Pin(config.SOIL_MOISTURE_PIN))
        self._adc.atten(machine.ADC.ATTN_11DB)

    def _raw_to_percent(self, raw_value):
        """
        Converts raw ADC reading to moisture percentage.
        Clamps the result between 0% and 100%.
        """
        dry = config.SOIL_DRY_VALUE
        wet = config.SOIL_WET_VALUE

        # Invert because higher ADC = drier soil
        moisture = (dry - raw_value) / (dry - wet) * 100.0
        return round(max(0.0, min(100.0, moisture)), 2)

    def read(self):
        """
        Returns raw ADC value and calibrated moisture percentage.

        Returns:
            dict: {
                "soil_moisture_pct": float,
                "soil_moisture_raw": int,
                "moisture_level":    str,   # "dry" | "moderate" | "wet"
                "status":            "ok" | "error"
            }
        """
        try:
            raw = self._adc.read()
            pct = self._raw_to_percent(raw)

            # Human-readable classification
            if pct < 30:
                level = "dry"
            elif pct < 65:
                level = "moderate"
            else:
                level = "wet"

            return {
                "soil_moisture_pct": pct,
                "soil_moisture_raw": raw,
                "moisture_level":    level,
                "status":            "ok"
            }
        except Exception as e:
            if config.DEBUG_MODE:
                print(f"[SoilMoisture] Read error: {e}")
            return {
                "soil_moisture_pct": None,
                "soil_moisture_raw": None,
                "moisture_level":    None,
                "status":            "error"
            }
