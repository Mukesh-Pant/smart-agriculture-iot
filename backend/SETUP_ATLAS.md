# Atlas Migration + Database Schema Design

## Phase 6 — Cloud Database Setup

---

## What This Upgrade Does

| Before                      | After                                         |
| --------------------------- | --------------------------------------------- |
| `mongodb://localhost:27017` | `mongodb+srv://...atlas.mongodb.net`          |
| Data only on your laptop    | Data shared on cloud — team can all access it |
| No schema enforcement       | JSON Schema validation on all collections     |
| 2 collections               | 5 collections with proper indexes             |
| No ML history               | Recommendations saved to Atlas permanently    |

---

## Database Schema Design

### Database: `smart-agriculture-iot`

```
smart-agriculture-iot/
├── sensor_readings      ← raw IoT telemetry from ESP32
├── daily_summaries      ← pre-aggregated daily stats
├── recommendations      ← ML prediction history
├── devices              ← registered ESP32 devices
└── alerts               ← threshold breach alerts
```

### Collection: `sensor_readings`

```json
{
  "_id": "ObjectId (auto)",
  "device_id": "esp32_farm_01",
  "received_at": "ISODate (UTC, indexed+TTL)",
  "timestamp": 1234567890.0,
  "temperature_c": 28.5,
  "humidity_pct": 72.0,
  "soil_moisture_pct": 45.3,
  "moisture_level": "moderate",
  "ph_value": 6.8,
  "ph_category": "slightly_acidic",
  "has_errors": false,
  "sensor_status": { "dht22": "ok", "soil_moisture": "ok", "ph": "ok" }
}
```

**Indexes:** `received_at DESC` · `(device_id, received_at) DESC` · TTL 90 days

### Collection: `recommendations`

```json
{
  "_id": "ObjectId (auto)",
  "device_id": "esp32_farm_01",
  "created_at": "ISODate (UTC, TTL 180 days)",
  "type": "full",
  "result": {
    "crop": { "crop": "rice", "confidence": 0.87 },
    "fertilizer": { "fertilizer": "Urea", "confidence": 0.76 },
    "irrigation": { "action": "light_irrigation", "water_amount_mm": 17.5 }
  },
  "confidence": 0.87
}
```

### Collection: `alerts`

```json
{
  "_id": "ObjectId",
  "device_id": "esp32_farm_01",
  "created_at": "ISODate",
  "alert_type": "low_soil_moisture",
  "severity": "warning",
  "message": "Soil moisture dropped below 30%",
  "value": 24.1,
  "threshold": 30.0,
  "resolved": false
}
```

### Collection: `devices`

```json
{
  "_id": "ObjectId",
  "device_id": "esp32_farm_01",
  "registered_at": "ISODate",
  "name": "Main Field Sensor",
  "location": "North field, Mahendranagar",
  "firmware": "v1.0",
  "last_seen": "ISODate",
  "active": true
}
```

---

## PART A — Create MongoDB Atlas Account

### Step 1: Sign Up

1. Go to: **https://cloud.mongodb.com**
2. Click **Try Free** → sign up with Google or email
3. Choose **Free** plan (M0 tier — 512MB, always free)

### Step 2: Create Organisation & Project

1. Organisation name: `FarWesternUniversity` (or your name)
2. Project name: `SmartAgriculture`

### Step 3: Build a Cluster

1. Click **Build a Database**
2. Choose **M0 FREE** tier
3. Provider: **AWS** · Region: **Mumbai (ap-south-1)** ← closest to Nepal
4. Cluster name: `smart-agriculture-iot` (no spaces)
5. Click **Create**
6. Wait ~2 minutes for cluster to provision

---

## PART B — Configure Database Access

### Step 4: Create Database User

1. Left sidebar → **Database Access** → **Add New Database User**
2. Auth method: **Password**
3. Username: `smart-agriculture-iot_admin`
4. Password: Click **Autogenerate Secure Password** → **copy it immediately**
5. Database User Privileges: **Atlas admin**
6. Click **Add User**

> ⚠️ Save this password somewhere safe. You cannot retrieve it later.

### Step 5: Whitelist IP Addresses

1. Left sidebar → **Network Access** → **Add IP Address**
2. For development: Click **Allow Access from Anywhere** → `0.0.0.0/0`
   - This lets all team members connect without managing individual IPs
   - For production, restrict to specific IPs
3. Click **Confirm**

---

## PART C — Get Your Connection String

### Step 6: Copy Atlas URI

1. Go to **Database** → your cluster → Click **Connect**
2. Choose **Connect your application**
3. Driver: **Python** · Version: **3.12 or later**
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://smart-agriculture-iot_admin:<password>@smart-agriculture-iot.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=smart-agriculture-iot
   ```
5. Replace `<password>` with your actual password from Step 4

---

## PART D — Update Your .env File

Open `backend/.env` and update the MongoDB section:

```bash
# Replace the old local URI:
# MONGO_URI=mongodb://localhost:27017

# With your Atlas URI:
MONGO_URI=mongodb+srv://smart-agriculture-iot_admin:YOUR_PASSWORD@smart-agriculture-iot.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=smart-agriculture-iot
MONGO_DB_NAME=smart-agriculture-iot
```

> ⚠️ Never commit the .env file. Share the URI with teammates via
> WhatsApp/Discord, NOT through Git.

---

## PART E — Share With Team

Each teammate needs to:

1. **Pull the latest code** from GitHub
2. **Create their own `.env` file** — copy from `env.example.txt`
3. **Get the Atlas URI** from you (share privately)
4. **Paste it** into their `.env` as `MONGO_URI`
5. **Start the backend** — it auto-creates the schema and indexes

```bash
# Teammate setup (one time):
cd backend
copy env.example.txt .env
# Edit .env — paste the Atlas URI you shared with them
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## PART F — Update Files in Your Project

### Files to REPLACE:

```
backend/app/core/settings.py
backend/app/database/mongodb.py
backend/app/database/repository.py
backend/env.example.txt
```

---

## PART G — Verify Atlas Connection

Start the backend and watch the logs:

```bash
uvicorn app.main:app --reload
```

You should see:

```
[MongoDB] Connecting (Atlas Cloud)…
[MongoDB] ✅ Connected to database: 'smart-agriculture-iot'
[MongoDB] 🌐 Using MongoDB Atlas (cloud)
[MongoDB] Created collection 'sensor_readings' with schema validation.
[MongoDB] Created collection 'recommendations' with schema validation.
[MongoDB] Created collection 'alerts' with schema validation.
[MongoDB] Created collection 'devices' with schema validation.
[MongoDB] ✅ All indexes verified/created.
```

Then check Atlas in your browser:

1. Go to **Database** → **Browse Collections**
2. You should see the `smart-agriculture-iot` database with all 5 collections
3. As your ESP32 sends data, documents will appear in `sensor_readings`

---

## PART H — Atlas Dashboard Features (Free)

While you're in Atlas, explore these useful features:

| Feature              | Where to find                 |
| -------------------- | ----------------------------- |
| Browse data visually | Database → Browse Collections |
| Query profiler       | Performance → Query Profiler  |
| Real-time metrics    | Database → Metrics tab        |
| Charts (free)        | Charts tab in left sidebar    |
| Alerts               | Project → Alerts              |

---

## Troubleshooting

| Error                         | Cause                 | Fix                                      |
| ----------------------------- | --------------------- | ---------------------------------------- |
| `ServerSelectionTimeoutError` | IP not whitelisted    | Atlas → Network Access → Add `0.0.0.0/0` |
| `Authentication failed`       | Wrong password in URI | Re-check `.env` — no spaces around `=`   |
| `SSL handshake failed`        | Old pymongo version   | `pip install pymongo --upgrade`          |
| `Connection refused`          | Wrong URI format      | Must start with `mongodb+srv://`         |
| Collections not appearing     | First run needed      | Start backend once — it creates them     |
