# =============================================================
# utils/data_formatter.py — Sensor Data JSON Formatter
# Merges readings from all sensors into one structured payload
# ready for MQTT publishing or HTTP posting.
# =============================================================

import time
import config


def build_payload(dht_data, soil_data, ph_data):
    """
    Merges all sensor readings into a single clean JSON-ready dict.

    Args:
        dht_data  (dict): Output from DHT22Sensor.read()
        soil_data (dict): Output from SoilMoistureSensor.read()
        ph_data   (dict): Output from PHSensor.read()

    Returns:
        dict: Unified payload with device metadata and all sensor values.
    """
    payload = {
        "device_id":   config.DEVICE_ID,
        "timestamp":   time.time(),       # Unix epoch seconds (UTC from NTP)

        # Environmental
        "temperature_c":  dht_data.get("temperature_c"),
        "humidity_pct":   dht_data.get("humidity_pct"),

        # Soil moisture
        "soil_moisture_pct": soil_data.get("soil_moisture_pct"),
        "moisture_level":    soil_data.get("moisture_level"),

        # Soil pH
        "ph_value":    ph_data.get("ph_value"),
        "ph_category": ph_data.get("ph_category"),

        # Sensor health flags
        "sensor_status": {
            "dht22":        dht_data.get("status"),
            "soil_moisture": soil_data.get("status"),
            "ph":            ph_data.get("status"),
        }
    }
    return payload


def payload_has_errors(payload):
    """
    Returns True if any sensor reported an error.
    Useful for deciding whether to publish or skip.
    """
    statuses = payload.get("sensor_status", {})
    return any(v == "error" for v in statuses.values())
