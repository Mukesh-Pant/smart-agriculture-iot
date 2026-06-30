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

    def _status_text(self, status):
        """Maps a wlan.status() code to a human-readable explanation."""
        names = {}
        for attr in ("STAT_IDLE", "STAT_CONNECTING", "STAT_WRONG_PASSWORD",
                     "STAT_NO_AP_FOUND", "STAT_CONNECT_FAIL",
                     "STAT_GOT_IP", "STAT_ASSOC_FAIL", "STAT_HANDSHAKE_TIMEOUT"):
            if hasattr(network, attr):
                names[getattr(network, attr)] = attr
        return names.get(status, "code %s" % status)

    def scan(self):
        """
        Scans for nearby networks and prints them. Helps confirm the target
        SSID is visible and on 2.4 GHz (ESP32 cannot see 5 GHz networks).

        Returns:
            bool: True if the configured SSID was found in the scan.
        """
        self._wlan.active(True)
        found = False
        try:
            nets = self._wlan.scan()
        except Exception as e:
            if config.DEBUG_MODE:
                print(f"[WiFi] Scan failed: {e}")
            return False

        if config.DEBUG_MODE:
            print(f"[WiFi] Found {len(nets)} networks:")
        for net in nets:
            try:
                ssid = net[0].decode("utf-8", "ignore")
            except Exception:
                ssid = str(net[0])
            rssi = net[3]
            if config.DEBUG_MODE:
                print(f"   - '{ssid}'  (signal {rssi} dBm)")
            if ssid == config.WIFI_SSID:
                found = True

        if config.DEBUG_MODE:
            if found:
                print(f"[WiFi] Target SSID '{config.WIFI_SSID}' is visible.")
            else:
                print(f"[WiFi] WARNING: Target SSID '{config.WIFI_SSID}' "
                      f"NOT found. Check the name (case-sensitive) and that "
                      f"it is a 2.4 GHz network.")
        return found

    def _reset_interface(self):
        """
        Cleanly resets the WiFi interface to clear any leftover connection
        state. This prevents 'OSError: Wifi Internal State Error' which is
        raised when connect() is called while the interface still holds state
        from a previous network (common when switching SSIDs).
        """
        try:
            if self._wlan.isconnected():
                self._wlan.disconnect()
        except Exception:
            pass

        # Cycle the interface off then on to fully clear internal state.
        try:
            self._wlan.active(False)
            time.sleep(0.5)
        except Exception:
            pass

        self._wlan.active(True)
        time.sleep(0.5)

    def connect(self):
        """
        Activates WiFi interface and connects to the configured network.
        Blocks until connected or timeout is reached.

        Returns:
            bool: True if connected successfully, False on timeout.
        """
        # Ensure the interface is active first.
        self._wlan.active(True)

        # If already connected to the desired network, nothing to do.
        if self._wlan.isconnected():
            ssid = None
            try:
                ssid = self._wlan.config("essid")
            except Exception:
                pass
            if ssid == config.WIFI_SSID:
                if config.DEBUG_MODE:
                    print(f"[WiFi] Already connected: {self._wlan.ifconfig()[0]}")
                return True

        # Reset any leftover connection state before connecting. This avoids
        # "OSError: Wifi Internal State Error" that occurs when the interface
        # still holds state from a previous/other network.
        self._reset_interface()

        # Scan first so the logs show whether the SSID is even reachable.
        self.scan()

        if config.DEBUG_MODE:
            print(f"[WiFi] Connecting to '{config.WIFI_SSID}'...")

        # Retry the connect call itself: on some ESP32 builds the first
        # connect() right after a reset can still raise the internal state error.
        for attempt in range(3):
            try:
                self._wlan.connect(config.WIFI_SSID, config.WIFI_PASSWORD)
                break
            except OSError as e:
                if config.DEBUG_MODE:
                    print(f"[WiFi] connect() raised {e}, retrying ({attempt + 1}/3)...")
                self._reset_interface()
                time.sleep(1)
        else:
            if config.DEBUG_MODE:
                print("[WiFi] Failed to issue connect() after retries.")
            return False

        start = time.time()
        while not self._wlan.isconnected():
            if time.time() - start > config.WIFI_TIMEOUT:
                if config.DEBUG_MODE:
                    try:
                        status = self._wlan.status()
                        print(f"\n[WiFi] Connection timed out. "
                              f"Last status: {self._status_text(status)}")
                        print("[WiFi] Hint: WRONG_PASSWORD = bad password, "
                              "NO_AP_FOUND = wrong/hidden SSID or 5 GHz, "
                              "ASSOC/HANDSHAKE issues = signal or router setting.")
                    except Exception:
                        print("\n[WiFi] Connection timed out.")
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
