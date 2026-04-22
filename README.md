# AgriSense — IoT Smart Agriculture Monitoring & Decision Support System

> A production-grade IoT system that collects real-time soil and environmental data
> via ESP32 sensors, transmits over MQTT, stores in **MongoDB Atlas** (cloud), and applies
> advanced deep learning models to deliver crop, fertilizer, irrigation and soil fertility
> recommendations through a professional Next.js farmer dashboard.

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
│                   [ESP32 MicroPython 1.23]                           │
│               ↓ WiFi (MQTT publish) / LoRa (optional)               │
└──────────────────────────────────────────────────────────────────────┘
                           ↓ MQTT (port 1883)
┌──────────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                                 │
│   [Mosquitto MQTT Broker] → [Python FastAPI 0.115.5]                 │
│                                    ↓                                 │
│               [MongoDB Atlas — agrisense database]                   │
│     sensor_readings · recommendations · alerts · devices             │
│          Schema validation · Compound indexes · TTL                  │
│                                    ↓                                 │
│       [Phase 8–9 Advanced ML Engine — PyTorch + TabNet + SMOTE]     │
│   SwiFT (crop) · TTL (irrigation) · TabNet×2 (soil + fertilizer)    │
│              LIME XAI explanations for all predictions               │
│                                    ↓                                 │
│         [Phase 9: Gemini 1.5 Flash — Bilingual EN/NP Advice]        │
│          [Phase 9: xhtml2pdf PDF report generation (Jinja2)]        │
│                                    ↓                                 │
│                [OpenWeatherMap API integration]                      │
└──────────────────────────────────────────────────────────────────────┘
                           ↓ REST API (JSON, port 8000)
┌──────────────────────────────────────────────────────────────────────┐
│                    AUTH BACKEND LAYER                                │
│            [Express.js 5 + Mongoose 9 — port 5000]                  │
│        User onboarding · JWT token generation · MongoDB              │
└──────────────────────────────────────────────────────────────────────┘
                           ↓ JWT / NextAuth session
┌──────────────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYER                                 │
│     [Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui]          │
│    Dashboard · Sensor Live · AI Advisor · Analytics · Weather        │
│     Email magic-link auth (NextAuth 5) · Recharts data viz           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer        | Technology                                                  | Version     |
|--------------|-------------------------------------------------------------|-------------|
| Hardware     | ESP32 Dev Board                                             | —           |
| Sensors      | DHT22, Capacitive Soil Moisture, pH-4502C, NPK (planned)   | —           |
| Firmware     | MicroPython                                                 | 1.23        |
| Protocol     | MQTT (Mosquitto broker)                                     | 2.x         |
| ML Backend   | Python FastAPI + Uvicorn                                    | 0.115.5     |
| Database     | MongoDB Atlas (cloud) via Motor async driver                | Motor 3.6   |
| ML Models    | PyTorch · pytorch-tabnet · scikit-learn · LIME · SHAP       | PT 2.10     |
| AI Advice    | Gemini 1.5 Flash · bilingual EN/NP · offline fallback       | —           |
| PDF Reports  | xhtml2pdf · Jinja2 (pure-Python, Windows-compatible)        | 0.2.16      |
| Auth Backend | Express.js + Mongoose + JWT                                 | Express 5   |
| Auth         | NextAuth 5 (email magic links, MongoDB adapter)             | 5.x         |
| Frontend     | Next.js + TypeScript + Tailwind CSS 4 + shadcn/ui + Recharts| Next 16    |
| Weather      | OpenWeatherMap API (free tier)                              | 3.0         |
| Version Ctrl | Git + GitHub                                                | —           |

---

## ML Models — Phase 8–9 (Advanced Deep Learning, Nepal Profiles)

Phase 9 retrained all models with Nepal-specific crop profiles (18 crops) and SMOTE for fertilizer class imbalance (5780 → 21060 samples).

| Model | Architecture | Task | Features | Classes | Phase 9 Accuracy |
| --- | --- | --- | --- | --- | --- |
| **SwiFT** | Sparse Weighted Fusion Transformer (PyTorch) | Crop recommendation | 13 | 18 Nepal crops | **77.14%** |
| **TTL** | FT-Transformer (Feature Tokenizer + Transformer) | Irrigation advice | 9 num + 2 cat | 5 levels | **98.47%** |
| **TabNet Soil** | pytorch-tabnet + LIME XAI | Soil fertility | 5 | Low/Med/High | **98.67%** |
| **TabNet Fertilizer** | pytorch-tabnet + LIME XAI | Fertilizer choice | 8 | 5 Nepal fertilizers | **98.33%** |

### Key ML Features

- **Nepal crop profiles:** 18 crops common to Terai/hills (rice, maize, wheat, sugarcane, jute, mustard, lentil, etc.)
- **Crop-aware irrigation (dual-mode):** SwiFT crop output is automatically chained into TTL irrigation in the `/full` endpoint
- **LIME explainability:** `/explain` endpoint returns feature importance weights for fertilizer or soil predictions
- **FAO-56 ET0:** Hargreaves-Samani reference evapotranspiration used as a derived feature in the irrigation model
- **SMOTE:** Synthetic Minority Oversampling balances the fertilizer dataset before training

---

## Project Structure

```
smart-agriculture-iot/
│
├── esp32-firmware/                   # MicroPython ESP32 firmware
│   ├── main.py
│   ├── config.py
│   ├── mqtt_client.py
│   └── sensors/
│
├── backend/                          # Python FastAPI server (port 8000)
│   ├── app/
│   │   ├── main.py
│   │   ├── core/settings.py          # Pydantic BaseSettings, loads .env
│   │   ├── database/
│   │   │   ├── mongodb.py            # Atlas connection + schema + indexes
│   │   │   └── repository.py         # Data access layer
│   │   ├── models/
│   │   │   ├── sensor_data.py
│   │   │   └── recommendation.py     # Pydantic schemas for all 4 ML models
│   │   ├── routes/
│   │   │   ├── sensor_routes.py
│   │   │   ├── analytics_routes.py
│   │   │   ├── recommendation_routes.py  # 7 endpoints incl. /soil + /explain
│   │   │   └── weather_routes.py
│   │   └── services/
│   │       ├── mqtt_service.py
│   │       ├── ml_service.py         # Phase 8 inference: SwiFT+TTL+TabNet×2
│   │       └── weather_service.py
│   ├── ml/
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── swift_crop.py         # SwiFT architecture (PyTorch)
│   │   │   └── ttl_irrigation.py     # FT-Transformer architecture (PyTorch)
│   │   ├── train_models.py           # Phase 8 training pipeline (all 4 models)
│   │   ├── datasets/                 # (gitignored — Kaggle CSVs or auto-generated)
│   │   └── saved_models/             # (gitignored — regenerate via training)
│   ├── requirements.txt
│   └── .env.example
│
├── NodeJSbackend/                    # Express.js auth backend (port 5000)
│   ├── index.js
│   ├── controllers/
│   ├── middleware/AuthToken.js
│   ├── models/userModel.js
│   ├── routes/
│   └── config/
│
├── frontend/                         # Next.js 16 dashboard (port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/               # Login, email verification pages
│   │   │   ├── (dashboard)/          # Protected dashboard pages + components
│   │   │   ├── services/api.js        # FastAPI client (port 8000)
│   │   │   └── hooks/                # usePolling, useFetch
│   │   ├── lib/
│   │   │   ├── auth.ts               # NextAuth 5 config
│   │   │   └── mongodb.ts            # MongoDB client for NextAuth adapter
│   │   └── components/
│   │       └── CheckAuth.tsx         # Auth guard component
│   ├── package.json
│   └── .env.local.example
│
├── CLAUDE.md                         # AI assistant context (conventions, structure)
└── README.md                         # This file
```

---

## API Endpoints

### Python FastAPI (port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System status (MongoDB, MQTT, ML, weather) |
| GET | `/api/sensors/latest` | Most recent sensor reading |
| GET | `/api/sensors/history` | Paginated sensor history |
| POST | `/api/sensors/simulate` | Inject test sensor data |
| GET | `/api/recommend/full` | All 4 ML recommendations (crop-aware) |
| POST | `/api/recommend/crop` | SwiFT crop recommendation |
| POST | `/api/recommend/fertilizer` | TabNet fertilizer recommendation |
| POST | `/api/recommend/irrigation` | TTL irrigation advice (crop-aware mode) |
| POST | `/api/recommend/soil` | TabNet soil fertility (Low/Medium/High) |
| POST | `/api/recommend/explain` | LIME XAI feature importance explanation |
| GET | `/api/recommend/status` | ML models load status (4/4 Phase 8) |
| GET | `/api/analytics/summary/daily` | Daily aggregations |
| GET | `/api/analytics/summary/week` | Weekly summary |
| GET | `/api/weather/current` | Live OpenWeatherMap data |

### NodeJS Backend (port 5000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/userOnboarding` | Update user profile from NextAuth session |
| GET | `/api/settingCookies` | Generate JWT backend_token from session |

---

## Database Schema (MongoDB Atlas)

**Database:** `agrisense` (Python FastAPI)

| Collection        | Purpose                          | TTL     |
|-------------------|----------------------------------|---------|
| `sensor_readings` | Raw IoT telemetry from ESP32     | 90 days |
| `daily_summaries` | Pre-aggregated daily statistics  | —       |
| `recommendations` | ML prediction history            | 180 days|
| `devices`         | Registered ESP32 devices         | —       |
| `alerts`          | Threshold breach alerts          | —       |

**Database:** `Agricult` (NextAuth + NodeJS)

| Collection            | Purpose                     |
|-----------------------|-----------------------------|
| `users`               | User profiles (firstName, lastName, device_id) |
| `sessions`            | NextAuth sessions           |
| `accounts`            | OAuth accounts              |
| `verification_tokens` | Email magic-link tokens     |

---

## Getting Started

### Prerequisites
- Python 3.11+ (tested on 3.13)
- Node.js 20+
- Mosquitto MQTT broker
- MongoDB Atlas account (free tier)
- OpenWeatherMap API key (free)

### Quick Start

```bash
# 1. Clone
git clone https://github.com/Mukesh-Pant/smart-agriculture-iot.git
cd smart-agriculture-iot

# 2. Python Backend
cd backend
python -m venv venv
source venv/Scripts/activate      # Windows
pip install -r requirements.txt   # includes torch, pytorch-tabnet, lime, shap
cp .env.example .env              # fill in MONGO_URI, WEATHER_API_KEY
python ml/train_models.py         # trains all 4 Phase 8 models (~25 min, CPU)
uvicorn app.main:app --reload     # http://localhost:8000

# 3. NodeJS Backend (new terminal)
cd NodeJSbackend
npm install
cp .env.example .env              # fill in MONGODB_URI, JWT_SECRET, AUTH_SECRET
npm run dev                       # http://localhost:5000

# 4. Frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local  # fill in AUTH_SECRET, MONGODB_URI, Gmail SMTP
npm run dev                       # http://localhost:3000

# 5. MQTT Broker (new terminal)
mosquitto -v                      # or: mosquitto -c mosquitto.conf -v
```

### ML Model Training Details

```bash
cd backend
source venv/Scripts/activate
PYTHONIOENCODING=utf-8 python ml/train_models.py

# Trains 4 models sequentially:
#   Model 1: SwiFT Crop Recommendation  (~5 min)
#   Model 2: TTL Irrigation Advice      (~8 min)
#   Model 3: TabNet Soil Fertility      (~3 min)
#   Model 4: TabNet Fertilizer          (~5 min)
#
# Kaggle datasets (optional, auto-generated if absent):
#   ml/datasets/Crop_recommendation.csv   → kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
#   ml/datasets/Fertilizer_Prediction.csv → kaggle.com/datasets/gdabhishek/fertilizer-prediction
#   ml/datasets/Soil_Fertility.csv        → kaggle.com/datasets/rahuljaiswalonkaggle/soil-fertility-dataset
```

---

## Authentication Flow

1. User visits `/login` → enters email
2. NextAuth sends magic-link email (Gmail SMTP)
3. User clicks link → verified → redirected
4. First-time users → `/onboarding` (fill name, device ID)
5. NodeJS backend issues `backend_token` JWT cookie
6. Dashboard protected by `CheckAuth.tsx` (validates both NextAuth session + JWT)

---

## Environment Variables

| File | Variables |
|------|-----------|
| `backend/.env` | `MONGO_URI`, `MONGO_DB_NAME`, `WEATHER_API_KEY`, `WEATHER_CITY`, `MQTT_BROKER_HOST` |
| `frontend/.env.local` | `AUTH_SECRET`, `MONGODB_URI`, `EMAIL_SERVER_*`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL` |
| `NodeJSbackend/.env` | `MONGODB_URI`, `JWT_SECRET`, `AUTH_SECRET`, `CORS_ORIGINS` |

---

## Team Git Workflow

```bash
# Before starting work
git pull origin main

# Commit conventions
# feat:     new feature
# fix:      bug fix
# docs:     documentation only
# refactor: code restructure
# chore:    dependencies, gitignore

# Push feature
git add <files>
git commit -m "feat: description"
git push origin main
```

### Gitignored (regenerate locally)
```
backend/.env                    # contains Atlas password
backend/venv/                   # Python virtual environment
backend/ml/saved_models/        # .pth + .zip + .joblib model files
backend/ml/datasets/            # CSV training datasets
frontend/.env.local             # contains AUTH_SECRET
frontend/node_modules/          # npm packages
NodeJSbackend/.env
NodeJSbackend/node_modules/
```

---

## Project Progress

- [x] **Phase 1** — ESP32 hardware + MicroPython sensor firmware
- [x] **Phase 2** — Mosquitto MQTT broker + FastAPI backend
- [x] **Phase 3** — MongoDB Atlas integration + analytics endpoints + schema validation
- [x] **Phase 4** — Random Forest ML models (crop / fertilizer / irrigation) + Weather API
- [x] **Phase 5** — React.js farmer dashboard (initial version)
- [x] **Phase 6** — MongoDB Atlas cloud migration + UI redesign
- [x] **Phase 7** — Feature engineering + GridSearchCV + FAO-56 ET0 irrigation model
- [x] **Phase 8** — Advanced DL models: SwiFT + TTL + TabNet×2 + LIME XAI + Next.js migration
- [ ] Field testing & validation + final project report

---

## Academic Context

**Institution:** Far Western University, School of Engineering, Mahendranagar, Kanchanpur
**Degree:** Bachelor of Computer Engineering
**Submitted to:** Research, Innovation and Development Center (RIDC), FWU
**Under guidelines of:** Renewable World (RW), 2082
**Project title:** IoT-Based Smart Agriculture Monitoring and Decision Support System
**Reference paper:** "AI-Driven Smart Agriculture: An Integrated Approach"
