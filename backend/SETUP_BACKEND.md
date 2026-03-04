# Phase 2 Setup Guide — Windows
## Mosquitto MQTT Broker + FastAPI Backend

---

## PART A — Mosquitto MQTT Broker Setup

### Step 1: Download and Install Mosquitto

1. Go to: https://mosquitto.org/download/
2. Under **Windows**, download the **64-bit installer** (e.g. `mosquitto-2.0.18-install-win64.exe`)
3. Run the installer — keep all default options
4. Default install location: `C:\Program Files\mosquitto\`

---

### Step 2: Configure Mosquitto

Navigate to the install folder and open (or create) `mosquitto.conf`:
```
C:\Program Files\mosquitto\mosquitto.conf
```

Add these lines at the bottom of the file:
```
# Allow connections on default port
listener 1883

# Allow clients without username/password (local development)
allow_anonymous true
```

Save the file.

---

### Step 3: Start Mosquitto Broker

Open **Command Prompt as Administrator** and run:
```bash
cd "C:\Program Files\mosquitto"
mosquitto -c mosquitto.conf -v
```

The `-v` flag enables verbose logging so you can see connections.

You should see:
```
1700000000: mosquitto version 2.0.18 starting
1700000000: Config loaded from mosquitto.conf
1700000000: Opening ipv4 listen socket on port 1883
```

**Leave this terminal open** — the broker must keep running.

---

### Step 4: Test the Broker (Optional but Recommended)

Open a **second Command Prompt** and subscribe to your topic:
```bash
cd "C:\Program Files\mosquitto"
mosquitto_sub -h localhost -t "smart_agriculture/sensor_data" -v
```

Open a **third Command Prompt** and publish a test message:
```bash
cd "C:\Program Files\mosquitto"
mosquitto_pub -h localhost -t "smart_agriculture/sensor_data" -m "{\"test\": \"hello\"}"
```

If the subscriber terminal shows the message — your broker is working perfectly.

---

### Step 5: Find Your PC's Local IP (for ESP32 config)

Open Command Prompt and run:
```bash
ipconfig
```

Look for **IPv4 Address** under your active network adapter:
```
IPv4 Address. . . . . . . . . . : 192.168.1.100
```

Update `esp32/config.py`:
```python
MQTT_BROKER = "192.168.1.100"   # ← your actual IP here
```

**Important:** Your PC and ESP32 must be on the same WiFi network.

---

## PART B — FastAPI Backend Setup

### Step 1: Create a Virtual Environment

Open Command Prompt in your project folder:
```bash
cd smart-agriculture-iot
python -m venv venv
```

Activate it:
```bash
venv\Scripts\activate
```

You should see `(venv)` at the start of your prompt.

---

### Step 2: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

---

### Step 3: Create Your .env File

Copy the example file:
```bash
copy .env.example .env
```

Open `.env` and update:
```
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_TOPIC_SENSOR_DATA=smart_agriculture/sensor_data
APP_PORT=8000
APP_DEBUG=True
```

Leave MongoDB and Weather API settings as-is for now (Phase 3 & 4).

---

### Step 4: Run the FastAPI Backend

Make sure you are inside the `backend/` folder with venv activated:
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The `--reload` flag auto-restarts the server when you edit code.

You should see:
```
INFO  | Smart Agriculture Backend Starting Up
INFO  | Version : 1.0.0
INFO  | [APP] Starting MQTT subscriber service...
INFO  | [MQTT] Connected to broker at localhost:1883
INFO  | [MQTT] Subscribed to: smart_agriculture/sensor_data
INFO  | [APP] API docs available at: http://localhost:8000/docs
```

---

### Step 5: Test the API

Open your browser and visit:

| URL | What you see |
|-----|-------------|
| `http://localhost:8000/` | Root health check response |
| `http://localhost:8000/docs` | Interactive Swagger API docs |
| `http://localhost:8000/health` | `{"status": "healthy"}` |
| `http://localhost:8000/api/sensors/status` | System status |
| `http://localhost:8000/api/sensors/latest` | Latest ESP32 reading |
| `http://localhost:8000/api/sensors/history` | Reading history |

---

### Step 6: Test Without ESP32 (Simulate a Reading)

In Swagger UI (`/docs`), find **POST /api/sensors/simulate**, click
**Try it out**, and paste this body:

```json
{
  "device_id": "farm_node_01",
  "timestamp": 1700000000,
  "temperature_c": 27.5,
  "humidity_pct": 68.2,
  "soil_moisture_pct": 42.0,
  "moisture_level": "moderate",
  "ph_value": 6.8,
  "ph_category": "neutral",
  "received_at": "2024-01-01T00:00:00",
  "has_errors": false
}
```

Then visit `/api/sensors/latest` — you should see this data returned.

---

## PART C — Full End-to-End Test

With everything running simultaneously:

**Terminal 1** — Mosquitto broker:
```bash
cd "C:\Program Files\mosquitto"
mosquitto -c mosquitto.conf -v
```

**Terminal 2** — FastAPI backend (inside backend/ with venv active):
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3** — ESP32 via Thonny (or let it run autonomously)

Then visit `http://localhost:8000/api/sensors/latest` in browser.
If you see real temperature, humidity, moisture and pH values — **Phase 2 is complete!**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `mosquitto` not recognized | Add `C:\Program Files\mosquitto` to Windows PATH |
| Port 1883 already in use | Another MQTT service is running — stop it or change port |
| MQTT service can't connect | Check Mosquitto is running, check broker IP/port in .env |
| `ModuleNotFoundError` | Make sure venv is activated before running uvicorn |
| ESP32 can't reach broker | Ensure same WiFi; check Windows Firewall allows port 1883 |
| Firewall blocking 1883 | Windows Defender → Allow app → add mosquitto.exe |
