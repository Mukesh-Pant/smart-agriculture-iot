# Phase 5 Setup Guide
## React.js Farmer Dashboard — AgriSense

---

## What Phase 5 Adds

A complete, production-quality React dashboard with 5 pages:

| Page           | What It Shows                                              |
|----------------|------------------------------------------------------------|
| Dashboard      | Radial gauges, live sensor values, trend chart, quick AI summary |
| Sensor Monitor | Per-sensor history charts, live table, status indicators  |
| AI Advisor     | Full ML recommendations with confidence bars + custom crop tool |
| Analytics      | 7-day aggregated trends from MongoDB, summary table       |
| Weather        | Live weather card, agricultural impact assessment         |

---

## PART A — Project Structure

Place the frontend folder inside your project root:

```
smart-agriculture-iot/
├── esp32-firmware/
├── backend/
└── frontend/               ← new folder for Phase 5
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── services/
        │   └── api.js
        └── hooks/
            └── useApi.js
```

---

## PART B — Install Node.js (if not installed)

1. Go to: https://nodejs.org
2. Download **LTS version** (e.g. 20.x)
3. Run the installer — keep all defaults
4. Verify in a new terminal:
   ```bash
   node --version    # should show v20.x.x
   npm --version     # should show 10.x.x
   ```

---

## PART C — Install and Run the Dashboard

Open a **new terminal** in your `frontend/` folder:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
  VITE v6.0.5  ready in 312 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

Open your browser to: **http://localhost:3000**

---

## PART D — Running the Full Stack

You now need **4 terminals** running simultaneously:

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | MongoDB service (auto-starts with Windows) | Database |
| 2 | `mosquitto -c mosquitto.conf -v` | MQTT Broker |
| 3 | `uvicorn app.main:app --reload` (inside backend/) | FastAPI |
| 4 | `npm run dev` (inside frontend/) | Dashboard |

---

## PART E — Dashboard Pages Guide

### 🌿 Dashboard (Home)
- **Radial gauges** show live sensor values with colour-coded rings
- **Trend chart** plots last 30 readings for temperature and moisture
- **AI Quick Cards** show crop, irrigation, and fertilizer recommendations
- Weather widget in the top-right corner
- All data auto-refreshes every 8–15 seconds

### 📡 Sensor Monitor
- Large live value cards for all 4 sensors — glow red if soil moisture < 30%
- Individual line charts for each sensor's history
- Scrollable table of last 15 readings with timestamps and status

### 🤖 AI Advisor
- Full recommendation cards with confidence bars and top-3 alternatives
- NPK status badges (low / optimal / high) for fertilizer page
- Custom Crop Tool — enter your own N/P/K values and get instant recommendation
- Warning banners when weather API or sensor data is unavailable

### 📊 Analytics
- Today's min/avg/max summary cards
- 4 area charts showing 7-day trends for all sensors
- Full weekly summary table with all metrics

### 🌦️ Weather
- Large weather hero card with temperature, condition, hi/lo range
- 6-metric grid: humidity, wind, pressure, cloud cover, rainfall
- Agricultural impact panel — irrigation need, crop conditions, disease risk

---

## PART F — System Status Indicators (Sidebar)

The bottom of the sidebar shows 3 dots:

| Indicator | Green means | Red means |
|-----------|------------|-----------|
| MongoDB   | Database connected | Run `mongod` |
| ML Models | Models loaded | Run `python ml/train_models.py` |
| Weather   | API key configured | Add `WEATHER_API_KEY` to `.env` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm: not recognized` | Install Node.js from nodejs.org |
| Dashboard loads but no data | Check FastAPI is running on port 8000 |
| CORS errors in browser | FastAPI already has CORS enabled — check `uvicorn` is running |
| Weather page shows "Not Configured" | Add `WEATHER_API_KEY` to backend `.env` |
| AI Advisor shows "ML models not loaded" | Run `python ml/train_models.py` |
| Sensor data stuck / not updating | Check ESP32 is running and Mosquitto is active |
| Charts are empty | Wait 1–2 minutes for history to accumulate |
| Port 3000 in use | Edit `vite.config.js` → change `port: 3000` to `port: 3001` |

---

## Build for Production (Optional)

When your project is ready to deploy:
```bash
cd frontend
npm run build
```

This creates a `dist/` folder with optimised static files.
These can be served by any web server (Nginx, Apache, or directly via FastAPI's `StaticFiles`).
