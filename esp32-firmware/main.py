# =============================================================
# main.py — Smart Agriculture ESP32 Main Entry Point
#
# Execution flow:
#   1. Connect to WiFi
#   2. Connect to MQTT broker
#   3. Loop forever:
#        a. Read all sensors
#        b. Build unified JSON payload
#        c. Publish via MQTT
#        d. Sleep for configured interval
# =============================================================

import time
import config

from utils.wifi_manager   import WiFiManager
from utils.data_formatter import build_payload, payload_has_errors
from mqtt_client          import MQTTPublisher
from sensors.dht22_sensor        import DHT22Sensor
from sensors.soil_moisture_sensor import SoilMoistureSensor
from sensors.ph_sensor            import PHSensor


# ── Boot Message ──────────────────────────────────────────────
print("=" * 50)
print("  Smart Agriculture Monitoring System")
print(f"  Device: {config.DEVICE_ID}")
print("=" * 50)


# ── Initialise Modules ────────────────────────────────────────
wifi    = WiFiManager()
mqtt    = MQTTPublisher()
dht22   = DHT22Sensor()
soil    = SoilMoistureSensor()
ph      = PHSensor()


def connect_all():
    """
    Connects WiFi and MQTT broker.
    Halts with error LED blink if WiFi fails (no point continuing).
    """
    # ── WiFi ──
    if not wifi.connect():
        print("[MAIN] WiFi connection failed. Check SSID/password in config.py")
        print("[MAIN] Halting. Please reset the device after fixing WiFi settings.")
        while True:
            time.sleep(1)   # halt — prevents sensor loop without connectivity

    # ── MQTT ──
    if not mqtt.connect():
        print("[MAIN] MQTT broker unreachable. Check MQTT_BROKER IP in config.py")
        print("[MAIN] Will retry each publish cycle...")


def read_all_sensors():
    """
    Reads all three sensors and returns their data dicts.
    A small delay between reads avoids ADC cross-talk.
    """
    dht_data  = dht22.read()
    time.sleep_ms(200)

    soil_data = soil.read()
    time.sleep_ms(200)

    ph_data   = ph.read()

    return dht_data, soil_data, ph_data


def print_readings(payload):
    """Pretty-prints sensor values to serial console."""
    print("\n── Sensor Readings ──────────────────────────────")
    print(f"  Temperature : {payload['temperature_c']} °C")
    print(f"  Humidity    : {payload['humidity_pct']} %")
    print(f"  Soil Moisture: {payload['soil_moisture_pct']} % ({payload['moisture_level']})")
    print(f"  pH          : {payload['ph_value']} ({payload['ph_category']})")
    print(f"  Statuses    : {payload['sensor_status']}")
    print("─────────────────────────────────────────────────\n")


# ── Main Execution ────────────────────────────────────────────
connect_all()

print("[MAIN] Starting sensor loop. Reading every "
      f"{config.SENSOR_READ_INTERVAL}s...\n")

while True:
    try:
        # 1. Read sensors
        dht_data, soil_data, ph_data = read_all_sensors()

        # 2. Build payload
        payload = build_payload(dht_data, soil_data, ph_data)

        # 3. Log to console
        if config.DEBUG_MODE:
            print_readings(payload)

        # 4. Warn if any sensor errored (still publish partial data)
        if payload_has_errors(payload):
            print("[MAIN] Warning: one or more sensors reported an error.")

        # 5. Publish via MQTT
        mqtt.publish(payload)

    except Exception as e:
        print(f"[MAIN] Unexpected error in main loop: {e}")

    # 6. Wait before next reading
    time.sleep(config.SENSOR_READ_INTERVAL)
