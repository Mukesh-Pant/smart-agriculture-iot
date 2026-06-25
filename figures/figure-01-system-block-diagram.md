# Figure 1: Overall System Block Diagram

**Report location:** Section 4.1 — System Overview
**Tool:** Mermaid (paste into https://mermaid.live → Actions → Export PNG/SVG)
**Caption to use in report:** *Figure 1: Overall System Block Diagram*

This diagram shows the five-layer pipeline: IoT → Communication → Backend → ML Inference → Frontend, with MongoDB Atlas and OpenWeatherMap as supporting services.

---

## Mermaid Code

```mermaid
flowchart TB
    %% ---------- IoT LAYER ----------
    subgraph IOT["IoT Layer — Field Sensor Node"]
        direction LR
        DHT["DHT22<br/>Temperature & Humidity"]
        SOIL["Capacitive<br/>Soil Moisture Sensor"]
        PH["PH-4502C<br/>pH Sensor"]
        ESP["ESP32-WROOM-32<br/>MicroPython firmware<br/>reads all sensors every 10 s<br/>builds JSON payload"]
        DHT --> ESP
        SOIL --> ESP
        PH --> ESP
    end

    %% ---------- COMMUNICATION LAYER ----------
    subgraph COMM["Communication Layer"]
        BROKER["Mosquitto MQTT Broker<br/>username/password auth"]
    end

    %% ---------- BACKEND LAYER ----------
    subgraph BACKEND["Backend Layer — FastAPI on AWS EC2"]
        SUB["MQTT Subscriber<br/>+ Data Validation"]
        CACHE["In-memory Cache<br/>latest 100 readings"]
        WEATHER["Weather Service<br/>OpenWeatherMap<br/>cached 10 min"]
        ASM["Feature Vector Assembly<br/>sensor + weather"]
        SUB --> CACHE
        CACHE --> ASM
        WEATHER --> ASM
    end

    %% ---------- DATABASE ----------
    DB[("MongoDB Atlas<br/>sensor_readings ·<br/>recommendations")]

    %% ---------- ML LAYER ----------
    subgraph ML["ML Inference Layer"]
        CROP["Crop Ensemble<br/>RF + XGBoost + LightGBM"]
        IRR["Irrigation TTL<br/>FT-Transformer"]
        SOILM["Soil Fertility<br/>TabNet + LIME"]
        FERT["Fertilizer<br/>TabNet + LIME"]
    end

    %% ---------- FRONTEND ----------
    DASH["Next.js 16 Dashboard<br/>Recharts · live readings ·<br/>analytics · recommendations"]

    %% ---------- DATA FLOW ----------
    ESP -->|"JSON via MQTT every 10 s"| BROKER
    BROKER -->|"forward"| SUB
    SUB -->|"persist"| DB
    ASM --> CROP
    ASM --> IRR
    ASM --> SOILM
    ASM --> FERT
    CROP -->|"predictions (REST)"| DASH
    IRR --> DASH
    SOILM --> DASH
    FERT --> DASH
    CACHE -->|"live readings (REST)"| DASH
    DB -->|"history & analytics (REST)"| DASH

    %% ---------- STYLING ----------
    classDef iot fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef comm fill:#fef9c3,stroke:#ca8a04,color:#713f12;
    classDef backend fill:#dbeafe,stroke:#2563eb,color:#1e3a8a;
    classDef ml fill:#f3e8ff,stroke:#9333ea,color:#581c87;
    classDef front fill:#ffe4e6,stroke:#e11d48,color:#881337;
    classDef store fill:#e2e8f0,stroke:#475569,color:#1e293b;

    class DHT,SOIL,PH,ESP iot;
    class BROKER comm;
    class SUB,CACHE,WEATHER,ASM backend;
    class CROP,IRR,SOILM,FERT ml;
    class DASH front;
    class DB store;
```

---

## Export tips
- Paste the code into https://mermaid.live, wait for the live preview, then use **Actions → PNG** (transparent or white background) or **SVG** for vector quality.
- If the diagram looks too tall, change the first line to `flowchart LR` for a left-to-right layout.
- Colors are set via `classDef`; remove the styling block if you prefer a plain black-and-white figure for print.
