# =============================================================
# utils/wifi_manager.py — WiFi Connection Manager
# Handles connecting to WiFi with timeout, retry logic,
# and clean status reporting.
# =============================================================

import network
import time
import config


class WiFiManager:
    """Manages WiFi connection for the ESP32."""

    def __init__(self):
        self._wlan = network.WLAN(network.STA_IF)

    def connect(self):
        """
        Activates WiFi interface and connects to the configured network.
        Blocks until connected or timeout is reached.

        Returns:
            bool: True if connected successfully, False on timeout.
        """
        self._wlan.active(True)

        if self._wlan.isconnected():
            if config.DEBUG_MODE:
                print(f"[WiFi] Already connected: {self._wlan.ifconfig()[0]}")
            return True

        if config.DEBUG_MODE:
            print(f"[WiFi] Connecting to '{config.WIFI_SSID}'...")

        self._wlan.connect(config.WIFI_SSID, config.WIFI_PASSWORD)

        start = time.time()
        while not self._wlan.isconnected():
            if time.time() - start > config.WIFI_TIMEOUT:
                if config.DEBUG_MODE:
                    print("[WiFi] Connection timed out.")
                return False
            time.sleep(0.5)
            if config.DEBUG_MODE:
                print(".", end="")

        ip = self._wlan.ifconfig()[0]
        if config.DEBUG_MODE:
            print(f"\n[WiFi] Connected! IP: {ip}")
        return True

    def is_connected(self):
        """Returns True if currently connected to WiFi."""
        return self._wlan.isconnected()

    def get_ip(self):
        """Returns the assigned IP address string, or None if not connected."""
        if self._wlan.isconnected():
            return self._wlan.ifconfig()[0]
        return None
