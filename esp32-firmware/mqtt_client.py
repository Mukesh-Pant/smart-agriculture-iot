# =============================================================
# mqtt_client.py — MQTT Publisher for Smart Agriculture
# Uses MicroPython's umqtt.simple library to connect to broker
# and publish sensor JSON payloads to the configured topic.
# =============================================================

import ujson
import time
import config

try:
    from umqtt.simple import MQTTClient
except ImportError:
    raise ImportError(
        "umqtt.simple not found. On MicroPython, run:\n"
        "  import upip; upip.install('micropython-umqtt.simple')"
    )


class MQTTPublisher:
    """
    Manages MQTT connection and publishes sensor data payloads.
    Handles reconnection automatically on publish failure.
    """

    def __init__(self):
        self._client = None
        self._connected = False

    def _create_client(self):
        """Instantiates a new MQTTClient with config credentials."""
        client = MQTTClient(
            client_id = config.MQTT_CLIENT_ID,
            server    = config.MQTT_BROKER,
            port      = config.MQTT_PORT,
            user      = config.MQTT_USERNAME or None,
            password  = config.MQTT_PASSWORD or None,
            keepalive = 60
        )
        return client

    def connect(self):
        """
        Establishes connection to the MQTT broker.

        Returns:
            bool: True on success, False on failure.
        """
        try:
            self._client = self._create_client()
            self._client.connect()
            self._connected = True
            if config.DEBUG_MODE:
                print(f"[MQTT] Connected to broker at {config.MQTT_BROKER}:{config.MQTT_PORT}")
            return True
        except Exception as e:
            self._connected = False
            if config.DEBUG_MODE:
                print(f"[MQTT] Connection failed: {e}")
            return False

    def publish(self, payload_dict):
        """
        Serializes the payload dict to JSON and publishes to the topic.
        Attempts one automatic reconnect if the publish fails.

        Args:
            payload_dict (dict): The sensor data dict to publish.

        Returns:
            bool: True if published successfully.
        """
        json_str = ujson.dumps(payload_dict)

        try:
            self._client.publish(
                topic   = config.MQTT_TOPIC,
                msg     = json_str,
                retain  = False,
                qos     = 0
            )
            if config.DEBUG_MODE:
                print(f"[MQTT] Published → {config.MQTT_TOPIC}")
                print(f"       Payload: {json_str}")
            return True

        except Exception as e:
            if config.DEBUG_MODE:
                print(f"[MQTT] Publish failed: {e}. Attempting reconnect...")
            self._connected = False

            # Single reconnect attempt
            time.sleep(config.MQTT_RETRY_DELAY)
            if self.connect():
                return self.publish(payload_dict)
            return False

    def disconnect(self):
        """Gracefully disconnects from broker."""
        if self._client and self._connected:
            try:
                self._client.disconnect()
                if config.DEBUG_MODE:
                    print("[MQTT] Disconnected.")
            except Exception:
                pass
        self._connected = False
