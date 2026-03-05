# Phase 3 Setup Guide — MongoDB on Windows

## Installing MongoDB + Verifying Integration

---

## PART A — Install MongoDB Community Edition

### Step 1: Download MongoDB

1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - **Version:** 7.0 (latest stable)
   - **Platform:** Windows
   - **Package:** MSI
3. Click **Download**

---

### Step 2: Install MongoDB

1. Run the downloaded `.msi` installer
2. Choose **Complete** installation
3. ✅ Check **"Install MongoDB as a Service"** — this makes it start automatically with Windows
4. ✅ Check **"Install MongoDB Compass"** — this is the free GUI to browse your data visually
5. Click through and finish installation

Default install path: `C:\Program Files\MongoDB\Server\7.0\bin\`

---

### Step 3: Verify MongoDB is Running

Open **Command Prompt** and run:

```bash
mongosh
```

You should see:

```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/
Using MongoDB: 7.0.x
test>
```

Type `exit` to quit the shell.

If mongosh is not recognised, add MongoDB to PATH:

1. Search "Environment Variables" in Windows search
2. Edit System Variables → PATH
3. Add: `C:\Program Files\MongoDB\Server\7.0\bin`

---

### Step 4: Start MongoDB Manually (if not running as service)

```bash
mongod --dbpath "C:\data\db"
```

First time only — create the data directory:

```bash
mkdir C:\data\db
```

---

## PART B — Update Your Backend Files

### Files to REPLACE (copy from Phase 3 downloads):

```
backend/
├── .env.example                          ← updated (replace)
├── app/
│   ├── main.py                           ← updated (replace)
│   ├── core/
│   │   └── settings.py                   ← updated (replace)
│   ├── models/
│   │   └── sensor_data.py                ← updated (replace)
│   ├── services/
│   │   └── mqtt_service.py               ← updated (replace)
│   ├── routes/
│   │   ├── sensor_routes.py              ← updated (replace)
│   │   └── analytics_routes.py           ← NEW (add this file)
│   └── database/                         ← NEW folder
│       ├── __init__.py                   ← NEW
│       ├── mongodb.py                    ← NEW
│       └── repository.py                 ← NEW
```

---

### Step 5: Update your .env file

Open `backend/.env` and add/update:

```
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=smart_agriculture
MONGO_COLLECTION_READINGS=sensor_readings
MONGO_COLLECTION_DAILY=daily_summaries
```

---

## PART C — Run and Verify

### Start everything (3 terminals):

**Terminal 1** — MongoDB (if not running as service):

```bash
mongod --dbpath "C:\data\db"
```

**Terminal 2** — Mosquitto broker:

```bash
cd "C:\Program Files\mosquitto"
mosquitto -c mosquitto.conf -v
```

**Terminal 3** — FastAPI backend (inside backend/ with venv active):

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### What you should see on startup:

```
INFO | Smart Agriculture Backend Starting Up
INFO | [MongoDB] Connecting to mongodb://localhost:27017...
INFO | [MongoDB] Connected successfully.
INFO | [MongoDB] Using database: 'smart_agriculture'
INFO | [MongoDB] Indexes verified/created on 'sensor_readings'.
INFO | [APP] Starting MQTT subscriber service...
INFO | [MQTT] Event loop registered for async DB saves.
INFO | [MQTT] Connected to broker at localhost:1883
INFO | [MQTT] Subscribed to: smart_agriculture/sensor_data
INFO | [APP] API docs → http://localhost:8000/docs
```

---

### Step 6: Verify Data is Saving to MongoDB

1. Let ESP32 run for 1–2 minutes to collect a few readings
2. Visit: `http://localhost:8000/api/sensors/status`

You should see:

```json
{
  "mongodb_status": "connected",
  "total_readings_in_db": 12,
  "readings_in_memory": 12
}
```

3. Visit: `http://localhost:8000/api/analytics/summary/daily`

You should see:

```json
{
  "device_id": "farm_node_01",
  "date": "2024-11-15",
  "total_readings": 12,
  "temperature": { "avg": 27.4, "min": 26.1, "max": 28.9 },
  "humidity":    { "avg": 65.2, "min": 62.0, "max": 68.5 },
  ...
}
```

---

### Step 7: Browse Data in MongoDB Compass (GUI)

1. Open **MongoDB Compass** (installed with MongoDB)
2. Connect to: `mongodb://localhost:27017`
3. Open database: `smart_agriculture`
4. Open collection: `sensor_readings`
5. You will see every reading your ESP32 has sent — stored permanently!

---

## New API Endpoints Added in Phase 3

| Method | Endpoint                                       | Description                         |
| ------ | ---------------------------------------------- | ----------------------------------- |
| `GET`  | `/api/sensors/latest`                          | Latest reading (from MongoDB)       |
| `GET`  | `/api/sensors/history?page=1&limit=20`         | Paginated history from DB           |
| `GET`  | `/api/sensors/{id}`                            | Single reading by MongoDB \_id      |
| `POST` | `/api/sensors/simulate`                        | Test reading (also saves to DB)     |
| `GET`  | `/api/analytics/summary/daily`                 | Today's min/avg/max stats           |
| `GET`  | `/api/analytics/summary/daily?date=2024-11-15` | Stats for a specific day            |
| `GET`  | `/api/analytics/summary/week`                  | Last 7 days of daily summaries      |
| `GET`  | `/api/analytics/range?start=...&end=...`       | Readings in datetime range          |
| `GET`  | `/api/analytics/devices`                       | List all known device IDs           |
| `GET`  | `/health`                                      | Now shows MongoDB connection status |

---

## Troubleshooting

| Problem                         | Solution                               |
| ------------------------------- | -------------------------------------- |
| `mongodb_status: disconnected`  | Run `mongod` or check MongoDB service  |
| `mongosh` not found             | Add MongoDB bin folder to Windows PATH |
| `ServerSelectionTimeoutError`   | MongoDB not running — start it first   |
| Data saves to memory but not DB | Check startup logs for MongoDB errors  |
| Compass shows empty collection  | Wait for ESP32 to send a reading first |
