# 🌱 IoT-Based Smart Agriculture Monitoring & Decision Support System

> A real-time IoT system that collects soil and environmental data using ESP32 sensors,
> transmits data via MQTT, processes it through a FastAPI backend, and uses ML models
> to provide crop, fertilizer, and irrigation recommendations to farmers.

**Far Western University — Bachelor of Computer Engineering — Major Project**  
*Sapana Pandey · Mukesh Pant · Adarsh Joshi · Sagar Bist*

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Current Progress](#current-progress)
- [Roadmap](#roadmap)

---

## Project Overview

Traditional farming in Nepal relies heavily on intuition, leading to over-irrigation,
improper fertilizer use, and poor crop selection. This system addresses those problems
by providing data-driven, real-time recommendations powered by IoT sensors and
machine learning.

**Key Features (planned):**
- Real-time monitoring of temperature, humidity, soil moisture, and pH
- MQTT-based scalable data transmission from ESP32
- FastAPI backend with MongoDB storage
- Random Forest + TabNet ML models for crop/fertilizer/irrigation recommendations
- React.js farmer dashboard with live data and alerts

---

## System Architecture

```
[Sensors] → [ESP32 MicroPython] → [MQTT Broker] → [FastAPI Backend]
                                                          ↓
                                                   [MongoDB Database]
                                                          ↓
                                              [ML Recommendation Engine]
                                                          ↓
                                              [React.js Farmer Dashboard]
```

---

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Hardware      | ESP32, DHT22, Soil Moisture, pH   |
| Firmware      | MicroPython                       |
| Protocol      | MQTT (Mosquitto broker)           |
| Backend       | Python FastAPI                    |
| Database      | MongoDB                           |
| ML            | scikit-learn, TabNet (PyTorch)    |
| Frontend      | React.js + Shadcn UI              |
| Version Control | Git + GitHub                   |

---

## Project Structure

```
smart-agriculture/
├── esp32/                        # MicroPython firmware
│   ├── main.py                   # Main entry point
│   ├── config.py                 # Hardware & network config
│   ├── mqtt_client.py            # MQTT publisher
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
├── backend/                      # FastAPI server (coming soon)
├── ml/                           # ML models (coming soon)
├── frontend/                     # React dashboard (coming soon)
├── database/                     # MongoDB schemas (coming soon)
│
├── .gitignore
└── README.md
```

---

## Getting Started

### ESP32 Hardware Setup
See [`esp32/WIRING_GUIDE.md`](esp32/WIRING_GUIDE.md) for full pin diagrams.

### Flashing & Running on Windows
See [`esp32/SETUP_WINDOWS.md`](esp32/SETUP_WINDOWS.md) for step-by-step instructions.

### Configuration
Edit `esp32/config.py` — set your WiFi credentials and MQTT broker IP.  
⚠️ Never commit real credentials — use the `.env` pattern for sensitive values.

---

## Current Progress

- [x] Hardware wiring (DHT22, Soil Moisture, pH sensor)
- [x] MicroPython sensor code (modular, production-style)
- [x] WiFi + MQTT publish pipeline
- [x] Git repository initialized
- [ ] MQTT broker setup (Mosquitto on Windows)
- [ ] FastAPI backend with MQTT subscriber
- [ ] MongoDB integration
- [ ] ML model training
- [ ] React.js dashboard

---

## Roadmap

| Phase | Description                          | Status      |
|-------|--------------------------------------|-------------|
| 1     | ESP32 hardware + sensor firmware     | ✅ Complete  |
| 2     | MQTT broker + FastAPI backend        | 🔄 Next      |
| 3     | MongoDB database integration         | ⏳ Planned   |
| 4     | ML model (crop/fertilizer/irrigation)| ⏳ Planned   |
| 5     | React.js farmer dashboard            | ⏳ Planned   |
| 6     | Field testing & validation           | ⏳ Planned   |

---

## Academic Context

Submitted to the School of Engineering, Far Western University, Mahendranagar, Kanchanpur
in partial fulfillment of the requirement for the degree of Bachelor in Computer Engineering.

**Supervisors:** Er. Birendra Singh Dhami · Er. Kamal Lekhak
