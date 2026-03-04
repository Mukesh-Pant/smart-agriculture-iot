# ESP32 Setup Guide — Windows
## Flashing MicroPython & Uploading Project Files

---

## Step 1: Install Required Tools

### 1a. Install Python (if not already installed)
- Download from https://python.org/downloads
- During install: ✅ check "Add Python to PATH"

### 1b. Install esptool (for flashing MicroPython firmware)
```
pip install esptool
```

### 1c. Install Thonny IDE (easiest for MicroPython development)
- Download from https://thonny.org
- Free, beginner-friendly, has built-in MicroPython support

---

## Step 2: Download MicroPython Firmware

1. Go to: https://micropython.org/download/ESP32_GENERIC/
2. Download the latest `.bin` file (e.g., `ESP32_GENERIC-20240602-v1.23.0.bin`)
3. Save it somewhere easy (e.g., `C:\micropython\`)

---

## Step 3: Find Your ESP32 COM Port

1. Connect ESP32 to laptop via USB
2. Open **Device Manager** (Win + X → Device Manager)
3. Expand **Ports (COM & LPT)**
4. Look for **Silicon Labs CP210x** or **CH340** → note the COM port (e.g., `COM5`)

---

## Step 4: Flash MicroPython onto ESP32

Open **Command Prompt** and run these commands:

```bash
# 4a. Erase existing flash (important!)
esptool.py --chip esp32 --port COM5 erase_flash

# 4b. Flash MicroPython firmware (adjust filename and COM port)
esptool.py --chip esp32 --port COM5 --baud 460800 write_flash -z 0x1000 C:\micropython\ESP32_GENERIC-20240602-v1.23.0.bin
```

You should see progress bars. When complete, the ESP32 has MicroPython installed.

---

## Step 5: Install umqtt Library on ESP32

1. Open **Thonny**
2. Go to **Tools → Options → Interpreter**
3. Select **MicroPython (ESP32)**
4. Select your COM port → click OK
5. In the Thonny shell (bottom panel), type:

```python
import upip
upip.install('micropython-umqtt.simple')
```

If upip fails (no WiFi yet), you can manually upload the library later.

---

## Step 6: Configure Your Project

1. Open `config.py` in Thonny
2. Update these values:
   ```python
   WIFI_SSID     = "YourActualWiFiName"
   WIFI_PASSWORD = "YourActualPassword"
   MQTT_BROKER   = "192.168.x.x"   # your PC's local IP
   ```
3. To find your PC's IP: open Command Prompt → type `ipconfig` → look for IPv4 Address

---

## Step 7: Upload Files to ESP32

### Using Thonny:
1. Open each file in Thonny
2. Go to **File → Save as...**
3. Choose **MicroPython device**
4. Keep the same filename and folder structure

### Upload order:
```
config.py                          → / (root)
mqtt_client.py                     → / (root)
sensors/dht22_sensor.py            → /sensors/
sensors/soil_moisture_sensor.py    → /sensors/
sensors/ph_sensor.py               → /sensors/
utils/wifi_manager.py              → /utils/
utils/data_formatter.py            → /utils/
main.py                            → / (root)  ← upload this last
```

### Create folders on device:
In Thonny's file panel (View → Files), right-click on the device root and create:
- `/sensors` folder
- `/utils` folder

---

## Step 8: Run and Test

1. With all files uploaded, press the **red Stop/Restart** button in Thonny
2. The ESP32 will auto-run `main.py` on boot
3. Watch the Shell panel — you should see:

```
==================================================
  Smart Agriculture Monitoring System
  Device: farm_node_01
==================================================
[WiFi] Connecting to 'YourWiFi'...
[WiFi] Connected! IP: 192.168.1.105

── Sensor Readings ──────────────────────────────
  Temperature : 28.5 °C
  Humidity    : 65.2 %
  Soil Moisture: 43.0 % (moderate)
  pH          : 6.8 (neutral)
─────────────────────────────────────────────────
[MQTT] Published → smart_agriculture/sensor_data
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| COM port not found | Check USB cable (some cables are charge-only) |
| esptool fails | Hold BOOT button on ESP32 while running command |
| DHT22 returns None | Check 10kΩ pull-up resistor; try GPIO 4 |
| Soil moisture always 0% or 100% | Re-calibrate DRY/WET values in config.py |
| pH reads 0.0 or 14.0 | Calibrate with buffer solutions; check Po pin wiring |
| MQTT connection refused | Ensure Mosquitto broker is running on PC; check IP |
| Import error: umqtt | Re-install umqtt via upip or manual upload |

---

## Next Steps (After Wiring Works)

1. ✅ Verify all sensor readings are reasonable
2. ✅ Install Mosquitto MQTT broker on Windows
3. ✅ Set up FastAPI backend with MQTT subscriber
4. ✅ Push project to GitHub with proper `.gitignore`
