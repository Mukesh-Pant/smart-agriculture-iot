# =============================================================
# app/services/mqtt_service.py — MQTT Subscriber Service
#
# This module runs a Paho MQTT client in a background thread.
# When a message arrives from the ESP32, it:
#   1. Parses the JSON payload
#   2. Validates it against the SensorReading Pydantic model
#   3. Stores it in an in-memory buffer (latest reading)
#   4. Appends it to a rolling history list
#   5. (Phase 3) Will also save to MongoDB
#
# The background thread starts when FastAPI starts up and
# stops cleanly when FastAPI shuts down.
# =============================================================

import json
import threading
import logging
from datetime import datetime
from typing import Optional

import paho.mqtt.client as mqtt

from app.core.settings import settings
from app.models.sensor_data import SensorReading, SensorReadingResponse

# ── Logger ────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

# ── In-Memory Storage ─────────────────────────────────────────
# Holds the most recent reading — served by GET /api/sensors/latest
latest_reading: Optional[SensorReadingResponse] = None

# Rolling history of last 100 readings — served by GET /api/sensors/history
reading_history: list[SensorReadingResponse] = []
MAX_HISTORY = 100


def _on_connect(client, userdata, flags, reason_code, properties=None):
    """
    Called when the MQTT client connects to the broker.
    We subscribe to the sensor topic here so it re-subscribes
    automatically if the connection drops and reconnects.
    """
    if reason_code == 0:
        logger.info(f"[MQTT] Connected to broker at "
                    f"{settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
        client.subscribe(settings.MQTT_TOPIC_SENSOR_DATA)
        logger.info(f"[MQTT] Subscribed to topic: {settings.MQTT_TOPIC_SENSOR_DATA}")
    else:
        logger.error(f"[MQTT] Connection failed — reason code: {reason_code}")


def _on_message(client, userdata, message):
    """
    Called every time a message arrives on the subscribed topic.
    Parses, validates, and stores the sensor payload.
    """
    global latest_reading, reading_history

    try:
        # 1. Decode raw bytes → string → dict
        raw_payload = message.payload.decode("utf-8")
        data_dict   = json.loads(raw_payload)

        logger.info(f"[MQTT] Message received on '{message.topic}'")
        logger.debug(f"[MQTT] Payload: {raw_payload}")

        # 2. Validate with Pydantic model
        reading = SensorReading(**data_dict)

        # 3. Build response object with server-side metadata
        has_errors = False
        if reading.sensor_status:
            has_errors = any(
                v == "error"
                for v in reading.sensor_status.model_dump().values()
            )

        response = SensorReadingResponse(
            **reading.model_dump(),
            received_at=datetime.utcnow(),
            has_errors=has_errors
        )

        # 4. Update latest reading
        latest_reading = response

        # 5. Append to rolling history (keep last MAX_HISTORY entries)
        reading_history.append(response)
        if len(reading_history) > MAX_HISTORY:
            reading_history.pop(0)

        logger.info(
            f"[MQTT] Stored reading from '{response.device_id}' — "
            f"Temp: {response.temperature_c}°C | "
            f"Humidity: {response.humidity_pct}% | "
            f"Moisture: {response.soil_moisture_pct}% | "
            f"pH: {response.ph_value}"
        )

        # Phase 3 hook — MongoDB save will go here
        # await save_to_mongodb(response)

    except json.JSONDecodeError as e:
        logger.error(f"[MQTT] Invalid JSON payload: {e}")
    except Exception as e:
        logger.error(f"[MQTT] Failed to process message: {e}")


def _on_disconnect(client, userdata, flags, reason_code, properties=None):
    """Called when the client disconnects. Paho auto-reconnects."""
    if reason_code != 0:
        logger.warning(f"[MQTT] Unexpected disconnect (code: {reason_code}). "
                       "Paho will attempt reconnect...")


# ── Public Interface ──────────────────────────────────────────

class MQTTService:
    """
    Manages the MQTT client lifecycle.
    Called by FastAPI lifespan events (startup / shutdown).
    """

    def __init__(self):
        self._client: Optional[mqtt.Client] = None
        self._thread: Optional[threading.Thread] = None

    def start(self):
        """
        Creates the MQTT client, registers callbacks,
        connects to the broker, and starts the network loop
        in a background daemon thread.
        """
        self._client = mqtt.Client(
            client_id          = settings.MQTT_CLIENT_ID,
            callback_api_version = mqtt.CallbackAPIVersion.VERSION2
        )

        # Register callbacks
        self._client.on_connect    = _on_connect
        self._client.on_message    = _on_message
        self._client.on_disconnect = _on_disconnect

        try:
            self._client.connect(
                host     = settings.MQTT_BROKER_HOST,
                port     = settings.MQTT_BROKER_PORT,
                keepalive= 60
            )
            # loop_start() runs the network loop in a background thread
            self._client.loop_start()
            logger.info("[MQTT] Service started successfully.")
        except Exception as e:
            logger.error(f"[MQTT] Could not connect to broker: {e}")
            logger.error("       Is Mosquitto running? Check SETUP_MOSQUITTO.md")

    def stop(self):
        """Gracefully stops the MQTT loop and disconnects."""
        if self._client:
            self._client.loop_stop()
            self._client.disconnect()
            logger.info("[MQTT] Service stopped.")


# Single instance used across the application
mqtt_service = MQTTService()
