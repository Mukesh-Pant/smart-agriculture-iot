# Frontend Setup Guide
## Phase 6 — Redesigned React.js Dashboard

---

## What Changed in This Upgrade

| Before | After |
|--------|-------|
| Playfair Display + DM Sans fonts | **Inter** (body) + **Sora** (display) + JetBrains Mono |
| Dark forest green theme | Professional slate-dark theme (matches Claude.ai aesthetic) |
| Basic hover states | Rich hover: border glow, card lift, row highlights |
| Static components | Animated: skeleton loaders, page fade-in, shimmer |
| Dense layout | Breathing whitespace, consistent 14px grid gap |
| Green-only palette | Full colour theory: rose/blue/amber/teal/violet semantics |
| Navigation label "Dashboard" | Clear page names: Overview, Sensor Live, AI Advisor… |

---

## Files Changed

```
frontend/
├── src/
│   └── App.jsx        ← Complete redesign (replace entirely)
├── SETUP_FRONTEND.md  ← This file
```

The `api.js`, `useApi.js`, `main.jsx`, `index.html`, `package.json`,
and `vite.config.js` files are **unchanged** — no need to replace them.

---

## Setup Steps

### Step 1 — Replace App.jsx

Copy the new `App.jsx` into `frontend/src/`, replacing the old file.

### Step 2 — Install dependencies (if not done)

```bash
cd frontend
npm install
```

No new packages are needed — Recharts, React 18, and Vite are already in
`package.json`.

### Step 3 — Start the dashboard

```bash
npm run dev
```

Open: **http://localhost:3000**

---

## Design System Reference

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display / headings | Sora | 600, 700 | Page titles, KPI numbers, card titles |
| Body / UI | Inter | 400, 500, 600 | Labels, paragraphs, buttons, nav |
| Monospace / data | JetBrains Mono | 400, 600 | Sensor values, percentages, timestamps |

These fonts load from Google Fonts CDN — no installation needed.
They match the clean, professional aesthetic of Claude.ai.

### Colour Palette

| Token | Hex | Used for |
|-------|-----|----------|
| `green` #22c55e | Brand accent, live data, OK status |
| `blue` #60a5fa | Humidity, info states |
| `amber` #f59e0b | Fertilizer, warnings, pH |
| `rose` #f43f5e | Temperature, errors, critical alerts |
| `teal` #14b8a6 | Weather, secondary data |
| `violet` #a78bfa | Custom tool, experimental features |
| `text` #f1f5f9 | Primary text |
| `textSub` #94a3b8 | Secondary text |
| `textMuted` #64748b | Labels, timestamps |
| `card` #1c2333 | Card backgrounds |
| `bg` #0f1117 | Page background |

### Interaction States

Every interactive element has three states:

| State | Effect |
|-------|--------|
| Default | Subtle border, no shadow |
| Hover | Border glow in accent colour, slight lift (`translateY(-2px)`), deeper shadow |
| Active | Pressed down, border brightens |

### Animation Catalogue

| Name | Duration | Used on |
|------|----------|---------|
| `pulse` | 2s infinite | Live dot (green sensor indicator) |
| `shimmer` | 1.6s infinite | Skeleton loaders while data loads |
| `fadeIn` | 0.25s | Page transitions when switching nav |

---

## Page Guide

### Overview
- **KPI row** — 4 metric cards with label, value, unit, and sub-text (e.g. heat stress warning)
- **Trend chart** — Area chart of last 40 readings with gradient fills
- **AI Snapshot** — Live mini-cards for crop, irrigation, fertilizer with confidence bars
- **Recent Readings** — 8-row table with row hover highlight

### Sensor Live
- **Gauge cards** — Large numbers with a progress bar representing range (0–50°C, 0–100%, 0–14 pH)
- Red `LOW` badge appears automatically when soil moisture < 30%
- **4 history charts** — One per sensor, line chart of last 60 readings

### AI Advisor
- **3 recommendation cards** — Crop (green), Irrigation (dynamic colour by urgency), Fertilizer (amber)
- Each shows: name, confidence bar, top 3 alternatives, advice text
- **NPK status** badges (optimal / low / high) in fertilizer card
- **Custom Crop Tool** — Input N/P/K/pH manually, get instant recommendation
- Violet accent to visually separate it from live-data cards

### Analytics
- Today's min/avg/max summary cards
- 4 area charts — one per sensor, 7-day rolling
- Summary table with hover row highlights

### Weather
- Hero card with gradient background, temperature, condition
- 6 KPI metrics: humidity, wind, pressure, cloud, rain
- Agricultural impact panel with hover border glow

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Fonts not loading | Check internet connection (fonts load from Google CDN) |
| Charts empty | Wait 1–2 min for sensor history to accumulate |
| Skeleton loaders stuck | Check FastAPI is running on port 8000 |
| AI Advisor shows "ML models not loaded" | Run `python ml/train_models.py` |
| Weather card blank | Add `WEATHER_API_KEY` to `.env` |
| CORS errors | Vite proxy is configured — ensure `vite.config.js` proxy is in place |

---

## Build for Production

```bash
cd frontend
npm run build
# Creates optimised files in frontend/dist/
# Can be served by Nginx, or hosted on Vercel/Netlify for free
```
