# AgriSense — IoT Smart Agriculture Monitoring & Decision Support System

## Project Overview
An IoT-based system that monitors soil and environmental conditions via ESP32 sensors, transmits data over MQTT, stores in MongoDB Atlas, applies machine learning for crop/fertilizer/irrigation recommendations, and displays insights on a Next.js dashboard with email-based authentication.

**Academic project** for Bachelor of Computer Engineering at Far Western University, Mahendranagar, Nepal.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Firmware | ESP32 + MicroPython 1.23 |
| Protocol | MQTT (Mosquitto broker, port 1883) |
| ML Backend | Python FastAPI 0.115.5 + Uvicorn |
| Auth Backend | Express.js 5 + Mongoose 9 + JWT |
| Auth | NextAuth 5 (email magic links, MongoDB adapter) |
| Database | MongoDB Atlas (Motor for Python, Mongoose for Node) |
| ML (Phase 8) | PyTorch 2.10 · pytorch-tabnet 4.1 · scikit-learn 1.5 · LIME · SHAP |
| Frontend | Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + Recharts |
| Weather | OpenWeatherMap API (free tier) |

## Architecture
Three services run simultaneously:

| Service | Port | Directory | Role |
|---------|------|-----------|------|
| Next.js Frontend | 3000 | `frontend/` | UI, auth (NextAuth), SSR |
| NodeJS Backend | 5000 | `NodeJSbackend/` | User onboarding, JWT token generation |
| Python FastAPI | 8000 | `backend/` | Sensors, ML, analytics, weather |

The frontend makes direct HTTP requests to both backends. No proxy is used.

## Project Structure
```
frontend/              — Next.js 16 + TypeScript SPA
  src/app/             — App Router pages (auth, dashboard, onboarding)
  src/app/services/    — FastAPI client (api.js, port 8000)
  src/app/hooks/       — Custom hooks (usePolling, useFetch)
  src/app/(auth)/      — Login, email verification pages
  src/app/(dashboard)/ — Protected dashboard pages + components
  src/lib/             — NextAuth config, MongoDB client, Zod schemas
  src/components/      — Auth guards, shadcn/ui components
NodeJSbackend/         — Express.js auth & user management backend
  controllers/         — Route handlers (onboarding, cookie/JWT setup)
  middleware/          — JWT auth middleware
  models/              — Mongoose user model
  routes/              — Express routes
  config/              — MongoDB connection
backend/               — Python FastAPI backend + ML models
  app/                 — Main application (routes, services, models, database)
  ml/                  — ML training pipeline, datasets, saved models
esp32-firmware/        — MicroPython sensor firmware
```

## How to Run
All three services must run simultaneously.

### Python Backend (ML, sensors, weather)
```bash
cd backend
source venv/Scripts/activate    # Windows: venv\Scripts\activate
uvicorn app.main:app --reload   # Runs on http://localhost:8000
```

### NodeJS Backend (auth, user management)
```bash
cd NodeJSbackend
npm install                     # First time only
npm run dev                     # Runs on http://localhost:5000 (requires nodemon)
```

### Frontend (Next.js)
```bash
cd frontend
npm install                     # First time only
npm run dev                     # Runs on http://localhost:3000
```

### ML Model Training (Phase 8)
```bash
cd backend
source venv/Scripts/activate    # activate venv first
python ml/train_models.py       # Trains all 4 Phase 8 models, saves to ml/saved_models/
# Models: SwiFT (crop), TTL (irrigation), TabNet×2 (soil + fertilizer)
# Expected accuracy: crop 63%, irrigation 99%, soil 85%, fertilizer 97%
```

## Key Files
- **Python backend entry:** `backend/app/main.py`
- **Settings:** `backend/app/core/settings.py` (Pydantic BaseSettings, loads .env)
- **Database (Python):** `backend/app/database/mongodb.py` (connection, schema validation, indexes)
- **Repository:** `backend/app/database/repository.py` (data access layer)
- **Routes (Python):** `backend/app/routes/` (sensor, analytics, recommendation, weather)
- **Services:** `backend/app/services/` (mqtt, ml_service, weather)
- **ML training:** `backend/ml/train_models.py` (Phase 8: SwiFT + TTL + TabNet×2)
- **ML models (PyTorch):** `backend/ml/models/swift_crop.py`, `backend/ml/models/ttl_irrigation.py`
- **ML inference service:** `backend/app/services/ml_service.py` (loads all 4 Phase 8 models)
- **Recommendation schemas:** `backend/app/models/recommendation.py`
- **NodeJS entry:** `NodeJSbackend/index.js`
- **User model:** `NodeJSbackend/models/userModel.js`
- **Auth middleware:** `NodeJSbackend/middleware/AuthToken.js`
- **Frontend layout:** `frontend/src/app/layout.tsx`
- **NextAuth config:** `frontend/src/lib/auth.ts`
- **API client (FastAPI):** `frontend/src/app/services/api.js`
- **API client (NodeJS):** `frontend/src/app/(dashboard)/_components/Common.tsx`
- **Auth guards:** `frontend/src/components/CheckAuth.tsx`
- **ESP32 main:** `esp32-firmware/main.py`

## API Endpoints

### Python FastAPI (port 8000)
- `GET /health` — system status
- `GET /api/sensors/latest` — most recent sensor reading
- `GET /api/sensors/history` — paginated history
- `GET /api/sensors/status` — sensor system status
- `POST /api/sensors/simulate` — inject test data
- `GET /api/recommend/full` — all 4 ML recommendations (crop-aware irrigation)
- `POST /api/recommend/crop` — crop recommendation (SwiFT transformer)
- `POST /api/recommend/fertilizer` — fertilizer recommendation (TabNet)
- `POST /api/recommend/irrigation` — irrigation advice (TTL, crop-aware dual-mode)
- `POST /api/recommend/soil` — soil fertility analysis Low/Medium/High (TabNet)
- `POST /api/recommend/explain` — LIME XAI explanation for fertilizer or soil
- `GET /api/recommend/status` — ML model load status (all 4 Phase 8 models)
- `GET /api/analytics/summary/daily` — daily aggregations
- `GET /api/analytics/summary/week` — weekly summary
- `GET /api/weather/current` — live weather

### NodeJS Backend (port 5000)
- `POST /api/userOnboarding` — update user profile from NextAuth session
- `GET /api/settingCookies` — generate JWT backend_token from session

## Authentication
- **Provider:** NextAuth 5 with email magic links (Nodemailer/Gmail SMTP)
- **Adapter:** MongoDB adapter stores sessions in `Agricult` database
- **Flow:** Login → email verification → onboarding (first time) → JWT setup → dashboard
- **JWT:** `backend_token` cookie generated by NodeJS backend from NextAuth session
- **Protected routes:** Enforced by `CheckAuth.tsx` component

## Conventions
- **Git commits:** Use prefixes `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **Python backend:** Async/await throughout; Motor for MongoDB; Pydantic for validation
- **NodeJS backend:** Express.js with Mongoose; JWT for token auth
- **Frontend:** Next.js App Router; TypeScript; Tailwind + shadcn/ui; Recharts for charts
- **Environment:** All secrets in `.env` / `.env.local` (never commit). See `.env.example` templates
- **ML models:** Phase 8 models saved in `backend/ml/saved_models/` (gitignored, regenerate via training):
  - PyTorch `.pth` files for SwiFT + TTL models
  - pytorch-tabnet `.zip` files for soil + fertilizer TabNet models
  - `.joblib` files for scalers, encoders, LIME background arrays
- **Datasets:** CSV files in `backend/ml/datasets/` (gitignored, Kaggle or auto-generated)

## Database
Two databases on the same MongoDB Atlas cluster:

### `agrisense` database (Python FastAPI)
- **Collections:** `sensor_readings` (90-day TTL), `daily_summaries`, `recommendations` (180-day TTL), `devices`, `alerts`
- **Indexes:** Compound on `(device_id, received_at)` and `(created_at)`

### `Agricult` database (NextAuth + NodeJS)
- **Collections:** `users`, `sessions`, `accounts`, `verification_tokens`
- **User fields:** firstName, lastName, email, emailVerified, device_id, user_role

## Environment Variables
- `backend/.env` — Python backend (MQTT, MongoDB, Weather API, ML settings). See `backend/.env.example`
- `frontend/.env.local` — Next.js (AUTH_SECRET, MONGODB_URI, Gmail SMTP, BACKEND URL). See `frontend/.env.local.example`
- `NodeJSbackend/.env` — Express backend (MONGODB_URI, JWT secret, AUTH_SECRET, CORS origins). See `NodeJSbackend/.env.example`

## ML Models (Phase 8 — Advanced Deep Learning)
All four models are defined in `backend/ml/models/` and trained via `backend/ml/train_models.py`.

1. **SwiFT Crop** (`swift_crop.py`) — Sparse Weighted Fusion Transformer (custom PyTorch)
   - 13 features → 22 crop classes · Sparse top-k self-attention · Learnable fusion gate
   - Test accuracy: ~63% (22-class problem, 2200 training rows)

2. **TTL Irrigation** (`ttl_irrigation.py`) — FT-Transformer (Feature Tokenizer + Transformer)
   - 9 numerical + 2 categorical features → 5 irrigation levels · Crop-aware dual-mode
   - Test accuracy: **98.85%** · Supports `crop_aware=True` (chains SwiFT crop output)

3. **TabNet Soil Fertility** — pytorch-tabnet Classifier + LIME XAI
   - 5 features (N, P, K, pH, moisture) → Low / Medium / High · LIME local explanations
   - Test accuracy: **85.2%**

4. **TabNet Fertilizer** — pytorch-tabnet Classifier + LIME XAI
   - 8 features (temp, humidity, moisture, soil_type, crop_type, N, K, P) → 7 fertilizers
   - Test accuracy: **96.75%**

## Sensors (ESP32)
- DHT22 (GPIO 4) — temperature & humidity
- Capacitive soil moisture (GPIO 34) — soil moisture %
- PH-4502C (GPIO 35) — soil pH
- NPK sensor — planned but not yet integrated in firmware

## Testing
- No automated test suite yet
- Manual testing via `POST /api/sensors/simulate` endpoint
- ML model evaluation happens during training (`train_models.py` prints accuracy metrics)
- End-to-end API verification via curl against all 7 `/api/recommend/*` endpoints
