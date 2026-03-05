# Phase 4 Setup Guide
## Weather API + ML Recommendation Engine

---

## Overview — What Phase 4 Adds

```
ESP32 Sensors → MQTT → FastAPI → MongoDB  (Phase 1-3)
                                    +
              OpenWeatherMap API  ──┤
                                    +
              ML Models            ──┴──→ Recommendations
                (Crop / Fertilizer / Irrigation)
```

---

## PART A — Get OpenWeatherMap API Key (Free)

### Step 1: Create Account
1. Go to: https://openweathermap.org/api
2. Click **Sign Up** → create a free account
3. Verify your email

### Step 2: Get API Key
1. Log in → click your username → **My API Keys**
2. Copy the **Default** key (or generate a new one)
3. It looks like: `a1b2c3d4e5f6789012345678abcdef01`

### Step 3: Wait for Activation
New API keys take **10–15 minutes** to activate.
Test it by visiting in your browser:
```
https://api.openweathermap.org/data/2.5/weather?q=Mahendranagar,NP&appid=YOUR_KEY
```
If you see JSON weather data — your key works!

### Step 4: Update .env
```
WEATHER_API_KEY=a1b2c3d4e5f6789012345678abcdef01
WEATHER_CITY=Mahendranagar
WEATHER_COUNTRY_CODE=NP
```

---

## PART B — Install New Python Dependencies

With venv activated inside your `backend/` folder:
```bash
pip install -r requirements.txt
```

New packages added:
- `scikit-learn==1.5.2` — Random Forest models
- `numpy==2.1.3`        — Numerical computing
- `pandas==2.2.3`       — Dataset loading
- `joblib==1.4.2`       — Model file serialization

---

## PART C — Download Training Datasets

You need 2 CSV files. Place them in `backend/ml/datasets/`:

### Dataset 1: Crop Recommendation
- **URL:** https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
- **File:** `Crop_recommendation.csv`
- **Size:** ~1,500 rows | 8 columns (N, P, K, temperature, humidity, ph, rainfall, label)
- **Kaggle account required** (free)

### Dataset 2: Fertilizer Prediction
- **URL:** https://www.kaggle.com/datasets/gdabhishek/fertilizer-prediction
- **File:** `Fertilizer_Prediction.csv`
- **Size:** ~99 rows | 8 columns

### How to download from Kaggle:
1. Create free account at kaggle.com
2. Go to the dataset URL
3. Click **Download** → extract the ZIP
4. Copy the CSV file into `backend/ml/datasets/`

> **Note:** The Irrigation model uses synthetically generated data —
> no download needed. It trains automatically.

After downloading, your folder should look like:
```
backend/ml/datasets/
├── Crop_recommendation.csv
└── Fertilizer_Prediction.csv
```

---

## PART D — Train the ML Models

With venv activated, from the `backend/` folder:
```bash
python ml/train_models.py
```

Expected output:
```
============================================================
  Smart Agriculture — ML Model Training
============================================================

── Model 1: Crop Recommendation ─────────────────────────
  Loaded: Crop_recommendation.csv — 2200 rows, 8 columns
  Classes (22): ['apple', 'banana', 'blackgram', ...]
  Training Random Forest (200 trees)...
  📊 Crop Recommendation Evaluation:
     Test Accuracy  : 99.32%
     CV Score (3-fold): 98.86% ± 0.41%
  ✅ Saved: crop_recommendation_model.joblib
  ✅ Saved: crop_label_encoder.joblib
  ✅ Saved: crop_feature_scaler.joblib

── Model 2: Fertilizer Recommendation ───────────────────
  ...
  ✅ Saved: fertilizer_recommendation_model.joblib

── Model 3: Irrigation Recommendation ───────────────────
  Generated 5000 synthetic samples.
  ...
  ✅ Saved: irrigation_recommendation_model.joblib

============================================================
✅ All models saved to ml/saved_models/
```

Training takes approximately **30–60 seconds**.

---

## PART E — Update Backend Files

### Files to ADD (new):
```
backend/app/models/recommendation.py
backend/app/routes/weather_routes.py
backend/app/routes/recommendation_routes.py
backend/app/services/weather_service.py
backend/app/services/ml_service.py
backend/ml/train_models.py
backend/ml/datasets/          ← folder (add your CSVs here)
backend/ml/saved_models/      ← folder (auto-created by training)
```

### Files to REPLACE (updated):
```
backend/app/main.py
backend/app/core/settings.py
backend/requirements.txt
backend/env.example.txt
```

---

## PART F — Start and Test

**Terminal 1** — MongoDB service (already running as Windows service)

**Terminal 2** — Mosquitto broker:
```bash
cd "C:\Program Files\mosquitto"
mosquitto -c mosquitto.conf -v
```

**Terminal 3** — FastAPI backend:
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Expected startup logs:
```
INFO | Smart Agriculture Backend — Phase 4
INFO | [MongoDB] Connected successfully.
INFO | [APP] Starting MQTT subscriber service...
INFO | [MQTT] Connected to broker at localhost:1883
INFO | [APP] Loading ML recommendation models...
INFO | [ML] Loaded: crop_recommendation_model.joblib
INFO | [ML] Loaded: fertilizer_recommendation_model.joblib
INFO | [ML] Loaded: irrigation_recommendation_model.joblib
INFO | [ML] 3/3 models loaded successfully.
INFO | [APP] Warming up weather cache...
INFO | [Weather] Fetched: Mahendranagar — 28.5°C, 72% humidity, haze
INFO | [APP] Ready to serve requests.
```

---

## PART G — Test All New Endpoints

Visit `http://localhost:8000/docs` and test:

### 1. Check system health
`GET /health`
```json
{
  "mongodb":     "connected",
  "ml_models":   "loaded",
  "weather_api": "configured"
}
```

### 2. Get current weather
`GET /api/weather/current`
```json
{
  "city": "Mahendranagar",
  "temperature_c": 28.5,
  "humidity_pct": 72.0,
  "rainfall_monthly_mm": 0.0,
  "condition_desc": "haze"
}
```

### 3. Full recommendation (most important endpoint)
`GET /api/recommend/full`
```json
{
  "crop": {
    "crop": "rice",
    "confidence": 0.87,
    "confidence_pct": "87.0%",
    "advice": "Rice thrives in waterlogged conditions..."
  },
  "fertilizer": {
    "fertilizer": "Urea",
    "advice": "Apply Urea for nitrogen deficiency..."
  },
  "irrigation": {
    "action": "light_irrigation",
    "urgency": "medium",
    "water_amount_mm": 17.5,
    "advice": "Soil is slightly dry. Apply 15-20mm of water."
  }
}
```

### 4. Custom crop recommendation
`POST /api/recommend/crop`
```json
{
  "nitrogen": 90,
  "phosphorus": 42,
  "potassium": 43,
  "ph": 6.5
}
```

---

## New Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/weather/current` | Live weather for your city |
| `GET` | `/api/weather/status` | API key configuration check |
| `GET` | `/api/recommend/full` | All 3 recommendations from live data |
| `POST` | `/api/recommend/crop` | Crop recommendation (custom NPK) |
| `POST` | `/api/recommend/fertilizer` | Fertilizer recommendation |
| `POST` | `/api/recommend/irrigation` | Irrigation recommendation |
| `GET` | `/api/recommend/status` | ML models load status |
| `GET` | `/health` | Full system health (now includes ML + weather) |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Weather API key not configured` | Add `WEATHER_API_KEY` to `.env` file |
| `401 Unauthorized` from weather | Key not activated yet — wait 15 min |
| `City not found` | Check `WEATHER_CITY` spelling in `.env` |
| `ML models not loaded` | Run `python ml/train_models.py` first |
| `FileNotFoundError` for CSV | Place CSVs in `backend/ml/datasets/` |
| Import error for scikit-learn | Run `pip install -r requirements.txt` |
| Crop model accuracy < 90% | Normal — dataset size affects accuracy |
