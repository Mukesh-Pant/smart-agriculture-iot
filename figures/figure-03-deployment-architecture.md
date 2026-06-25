# Figure 3: Deployment Architecture Diagram

**Report location:** Section 4.7 — Deployment Architecture
**Tool:** Mermaid (paste into https://mermaid.live → Actions → Export PNG/SVG)
**Caption to use in report:** *Figure 3: Deployment Architecture Diagram*

This diagram shows the four Docker Compose services on a single AWS EC2 t2.micro instance, the external cloud services (MongoDB Atlas, OpenWeatherMap), the GitHub Actions CI/CD pipeline, and the data flow from the ESP32 sensor node to the user's browser.

---

## Mermaid Code

```mermaid
flowchart TB
    %% ---------- EDGE DEVICE ----------
    subgraph FIELD["Field Sensor Node"]
        ESP["ESP32 + Sensors<br/>MicroPython"]
    end

    %% ---------- USER ----------
    USER["User Browser"]

    %% ---------- AWS EC2 / DOCKER COMPOSE ----------
    subgraph EC2["AWS EC2 t2.micro · ap-south-1 — Docker Compose"]
        NGINX["Nginx<br/>Reverse Proxy"]
        FE["Next.js 16<br/>Frontend container<br/>(Node 20)"]
        BE["FastAPI<br/>Backend container<br/>(Python 3.12)"]
        MOSQ["Mosquitto<br/>MQTT Broker container"]
    end

    %% ---------- EXTERNAL CLOUD ----------
    subgraph EXT["External Cloud Services"]
        ATLAS[("MongoDB Atlas")]
        OWM["OpenWeatherMap API"]
    end

    %% ---------- CI/CD ----------
    subgraph CICD["CI/CD Pipeline"]
        REPO["GitHub Repository"]
        GHA["GitHub Actions<br/>build & deploy on push to main"]
        REPO --> GHA
    end

    %% ---------- FLOWS ----------
    USER -->|"HTTPS"| NGINX
    NGINX -->|"/"| FE
    NGINX -->|"/api"| BE
    FE -->|"REST API"| BE
    ESP -->|"MQTT publish (every 10 s)"| MOSQ
    MOSQ -->|"forward"| BE
    BE -->|"read / write"| ATLAS
    BE -->|"weather query (cached)"| OWM
    GHA -.->|"deploy updated containers"| EC2

    %% ---------- STYLING ----------
    classDef edge fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef user fill:#ffe4e6,stroke:#e11d48,color:#881337;
    classDef ec2 fill:#dbeafe,stroke:#2563eb,color:#1e3a8a;
    classDef ext fill:#e2e8f0,stroke:#475569,color:#1e293b;
    classDef cicd fill:#fef9c3,stroke:#ca8a04,color:#713f12;

    class ESP edge;
    class USER user;
    class NGINX,FE,BE,MOSQ ec2;
    class ATLAS,OWM ext;
    class REPO,GHA cicd;
```

---

## Export tips
- `flowchart TB` (top-bottom) keeps the EC2 box and external services neatly stacked. Use `LR` if you want a wider, shorter figure.
- The dotted arrow (`-.->`) marks the CI/CD deploy path so it visually differs from the runtime data flow.
- Remove the `classDef`/`class` block for a plain black-and-white print version.
