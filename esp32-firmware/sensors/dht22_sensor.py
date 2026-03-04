# =============================================================
# sensors/dht22_sensor.py — DHT22 Temperature & Humidity Reader
# Wraps MicroPython's built-in dht library with error handling
# and clean data output.
# =============================================================

import dht
import machine
import config


class DHT22Sensor:
    """
    Reads temperature (°C) and humidity (%) from a DHT22 sensor.
    The DHT22 requires a 10kΩ pull-up resistor on the data line.
    """

    def __init__(self):
        self._sensor = dht.DHT22(machine.Pin(config.DHT22_PIN))

    def read(self):
        """
        Triggers a measurement and returns a dict with temperature
        and humidity. Returns None values on read failure.

        Returns:
            dict: {
                "temperature_c": float | None,
                "humidity_pct": float | None,
                "status": "ok" | "error"
            }
        """
        try:
            self._sensor.measure()
            return {
                "temperature_c": round(self._sensor.temperature(), 2),
                "humidity_pct":  round(self._sensor.humidity(), 2),
                "status": "ok"
            }
        except OSError as e:
            if config.DEBUG_MODE:
                print(f"[DHT22] Read error: {e}")
            return {
                "temperature_c": None,
                "humidity_pct":  None,
                "status": "error"
            }
