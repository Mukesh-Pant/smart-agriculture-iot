# 🌱 AgriSense — IoT Smart Agriculture Monitoring & Decision Support System

> A production-grade IoT system that collects real-time soil and environmental data
> via ESP32 sensors, transmits over MQTT, stores in **MongoDB Atlas** (cloud), and applies
> machine learning to deliver crop, fertilizer, and irrigation recommendations
> through a professional React.js farmer dashboard.

**Far Western University — Bachelor of Computer Engineering — Major Project**  
*Sapana Pandey · Mukesh Pant · Adarsh Joshi · Sagar Bist*  
**Supervisors:** Er. Birendra Singh Dhami · Er. Kamal Lekhak

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        HARDWARE LAYER                                │
│   [DHT22] [Soil Moisture] [pH Sensor] [NPK Sensor]                  │
│                        ↓ analog/digital                              │
│                   [ESP32 MicroPython]                                │
│               ↓ WiFi (MQTT publish) / LoRa (optional)               │
└──────────────────────────────────────────────────────────────────────┘
                           ↓ MQTT
┌──────────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                                 │
│   [Mosquitto MQTT Broker] → [FastAPI Python Server]                  │
│                                    ↓                                 │
│               [MongoDB Atlas — agrisense database]                   │
│     sensor_readings · recommendations · alerts · devices             │
│          Schema validation · Compound indexes · TTL                  │
│                                    ↓                                 │
│              [ML Engine: Random Forest + TabNet]                     │
│         crop · fertilizer · irrigation recommendations               │
│                                    ↓                                 │
│                [OpenWeatherMap API integration]                      │
└──────────────────────────────────────────────────────────────────────┘
                           ↓ REST API (JSON)
┌──────────────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYER                                 │
│         [React 18 + Recharts + Vite — Phase 6 design system]        │
│    Overview · Sensor Live · AI Advisor · Analytics · Weather         │
│     system-ui font · animated counters · dot-grid texture            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer        | Technology                                      | Version  |
|--------------|-------------------------------------------------|----------|
| Hardware     | ESP32 Dev Board                                 | —        |
| Sensors      | DHT22, Capacitive Soil Moisture, pH, NPK        | —        |
| Firmware     | MicroPython                                     | 1.23     |
| Protocol     | MQTT (Mosquitto broker)                         | 2.x      |
| Backend      | Python FastAPI + Uvicorn                        | 0.115    |
| Database     | **MongoDB Atlas** (cloud) via Motor async driver | 7.x     |
| ML           | scikit-learn Random Forest + TabNet             | 1.5      |
| Weather      | OpenWeatherMap API (free tier)                  | 3.0      |
| Frontend     | React 18 + Recharts + Vite                      | 18.3/6.0 |
| Fonts        | system-ui / -apple-system · Geist Mono          | —        |
| Version Ctrl | Git + GitHub                                    | —        |

---

## Project Structure

```
smart-agriculture-iot/
│
├── esp32/                            # MicroPython firmware
│   ├── main.py
│   ├── config.py
│   ├── mqtt_client.py
│   ├── sensors/
│   │   ├── dht22_sensor.py
│   │   ├── soil_moisture_sensor.py
│   │   └── ph_sensor.py
│   ├── utils/
│   │   ├── wifi_manager.py
│   │   └── data_formatter.py
│   ├── WIRING_GUIDE.md
│   └── SETUP_WINDOWS.md
│
├── backend/                          # FastAPI server
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   └── settings.py           # All config from .env
│   │   ├── database/
│   │   │   ├── mongodb.py            # Atlas connection + schema + indexes
│   │   │   └── repository.py         # Sensor/Rec/Alert/Device repos
│   │   ├── models/
│   │   │   ├── sensor_data.py
│   │   │   └── recommendation.py
│   │   ├── routes/
│   │   │   ├── sensor_routes.py
│   │   │   ├── analytics_routes.py
│   │   │   ├── recommendation_routes.py
│   │   │   └── weather_routes.py
│   │   └── services/
│   │       ├── mqtt_service.py
│   │       ├── ml_service.py
│   │       └── weather_service.py
│   ├── ml/
│   │   ├── train_models.py           # Trains all 3 ML models
│   │   ├── generate_fertilizer_dataset.py
│   │   ├── datasets/                 # (gitignored — download from Kaggle)
│   │   └── saved_models/             # (gitignored — regenerate locally)
│   ├── env.example.txt               # Template — copy to .env
│   ├── requirements.txt
│   ├── SETUP_BACKEND.md
│   ├── SETUP_MONGODB.md
│   ├── SETUP_ATLAS.md                # Atlas migration guide
│   └── SETUP_PHASE4.md               # ML model training guide
│
├── frontend/                         # React.js dashboard
│   ├── src/
│   │   ├── App.jsx                   # All 5 pages (Phase 6 redesign)
│   │   ├── main.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── hooks/
│   │       └── useApi.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── SETUP_FRONTEND.md
│   └── SETUP_PHASE6.md               # ← Phase 6 setup guide
│
├── .gitignore
└── README.md                         # This file
```

---

## Database Schema (MongoDB Atlas)

**Database:** `agrisense`

| Collection          | Purpose                              | TTL        |
|---------------------|--------------------------------------|------------|
| `sensor_readings`   | Raw IoT telemetry from ESP32         | 90 days    |
| `daily_summaries`   | Pre-aggregated daily statistics      | —          |
| `recommendations`   | ML prediction history                | 180 days   |
| `devices`           | Registered ESP32 devices             | —          |
| `alerts`            | Threshold breach alerts              | —          |

All collections have **JSON Schema validation** and **compound indexes** applied automatically on first backend startup.

---

## Dashboard Pages (Phase 6 Design)

| Page            | Description                                                             |
|-----------------|-------------------------------------------------------------------------|
| **Overview**    | Animated KPI metrics, sensor trend chart, live AI snapshot, readings table |
| **Sensor Live** | Large numeric gauges, 4 individual history charts, auto-refresh 8s      |
| **AI Advisor**  | Full ML recommendations with confidence bars, NPK status, custom tool   |
| **Analytics**   | 7-day area charts + summary table from MongoDB Atlas aggregations        |
| **Weather**     | Hero weather card + agricultural impact assessment panel                 |

### Phase 6 UI Design Principles
- **Font:** `system-ui, -apple-system` (Claude.ai font stack) + Geist Mono for numbers
- **Colour:** `#090e09` near-black base · `#16c181` luminous teal-green accent
- **Depth:** 3 surface levels + top-edge glow on card hover
- **Motion:** animated counters, page fade-in, progress bar fill, shimmer skeletons
- **Texture:** dot-grid CSS background (pure CSS, zero images)

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Mosquitto MQTT broker
- MongoDB Atlas account (free — instructions in `backend/SETUP_ATLAS.md`)
- OpenWeatherMap API key (free — https://openweathermap.org/api)

### Quick Start (New Team Member)

```bash
# 1. Clone the repository
git clone https://github.com/Mukesh-Pant/smart-agriculture-iot.git
cd smart-agriculture-iot

# 2. Backend
cd backend
copy env.example.txt .env        # Windows
# cp env.example.txt .env        # Mac/Linux
# → Get Atlas MONGO_URI from team lead, paste into .env
pip install -r requirements.txt
python ml/train_models.py         # trains ML models locally
uvicorn app.main:app --reload     # http://localhost:8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                       # http://localhost:3000

# 4. MQTT broker (new terminal)
mosquitto -c mosquitto.conf -v

# 5. ESP32
# Flash firmware, edit config.py with WiFi credentials + MQTT broker IP
```

### Detailed Setup Guides

| Guide | What it covers |
|-------|----------------|
| [`backend/SETUP_ATLAS.md`](backend/SETUP_ATLAS.md) | MongoDB Atlas account + schema + team sharing |
| [`frontend/SETUP_PHASE6.md`](frontend/SETUP_PHASE6.md) | Phase 6: Atlas + UI redesign (complete guide) |
| [`esp32/WIRING_GUIDE.md`](esp32/WIRING_GUIDE.md) | Sensor wiring diagrams |
| [`esp32/SETUP_WINDOWS.md`](esp32/SETUP_WINDOWS.md) | Flashing MicroPython on Windows |
| [`backend/SETUP_BACKEND.md`](backend/SETUP_BACKEND.md) | FastAPI + MQTT setup |
| [`backend/SETUP_PHASE4.md`](backend/SETUP_PHASE4.md) | ML model training |
| [`frontend/SETUP_FRONTEND.md`](frontend/SETUP_FRONTEND.md) | React dashboard setup |

---

## Environment Variables

Copy `backend/env.example.txt` → `backend/.env`:

```bash
# MongoDB Atlas (get URI from team lead)
MONGO_URI=mongodb+srv://<user>:<pass>@agrisense.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=agrisense

# OpenWeatherMap
WEATHER_API_KEY=your_openweathermap_key
WEATHER_CITY=Mahendranagar
WEATHER_COUNTRY_CODE=NP

# MQTT
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
```

> ⚠️ **Never commit `.env`** — it contains the Atlas password. Share only via private message.

---

## Team Git Workflow

```bash
# ─── Before starting work each day ──────────────────────────
git pull origin main

# ─── After finishing a feature ──────────────────────────────
git add .
git commit -m "feat: describe what you built"
git push origin main

# ─── For a larger feature (use a branch) ────────────────────
git checkout -b feat/your-feature-name
# ... do work ...
git add .
git commit -m "feat: your feature description"
git push origin feat/your-feature-name
# → open Pull Request on GitHub → ask team lead to review + merge

# ─── Commit message conventions ─────────────────────────────
# feat:     new feature
# fix:      bug fix
# docs:     documentation only
# refactor: code restructure (no behaviour change)
# test:     adding or updating tests
# chore:    dependency updates, gitignore, etc.
```

### Files that are gitignored (each teammate regenerates locally)
```
backend/.env                    # contains Atlas password
backend/ml/saved_models/        # ~7MB binary files — run train_models.py
backend/ml/datasets/            # Kaggle CSVs — download individually
frontend/node_modules/          # ~200MB — run npm install
frontend/dist/                  # build output — run npm run build
```

---

## Project Progress

- [x] Phase 1 — ESP32 hardware + MicroPython sensor firmware
- [x] Phase 2 — Mosquitto MQTT broker + FastAPI backend
- [x] Phase 3 — MongoDB integration + analytics endpoints
- [x] Phase 4 — ML models (crop / fertilizer / irrigation) + Weather API
- [x] Phase 5 — React.js farmer dashboard (5 pages, Recharts)
- [x] **Phase 6 — MongoDB Atlas cloud migration + schema design + UI redesign**
- [ ] Phase 7 — Field testing & validation + final project report

---

## Academic Context

**Institution:** Far Western University, School of Engineering, Mahendranagar, Kanchanpur  
**Degree:** Bachelor of Computer Engineering  
**Submitted to:** Research, Innovation and Development Center (RIDC), FWU  
**Under guidelines of:** Renewable World (RW), 2082  
**Project title:** IoT-Based Smart Agriculture Monitoring and Decision Support System
