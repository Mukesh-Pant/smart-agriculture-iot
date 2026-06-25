# Figure 2: Crop-Aware Decision Flow Diagram

**Report location:** Section 4.5 — Crop-Aware Decision Flow
**Tool:** Mermaid (paste into https://mermaid.live → Actions → Export PNG/SVG)
**Caption to use in report:** *Figure 2: Crop-Aware Decision Flow Diagram*

This diagram shows the two operating modes (General sensor-based vs. Crop-aware) and how a confirmed crop personalises the fertilizer and irrigation models.

---

## Mermaid Code

```mermaid
flowchart TD
    START([Sensor readings + Weather data]) --> FV["Assemble feature vector"]
    FV --> CROPMODEL["Crop Ensemble<br/>RF + XGBoost + LightGBM"]
    CROPMODEL --> TOP3["Top-3 crop recommendations<br/>with confidence scores"]
    TOP3 --> Q{"Farmer confirms<br/>a recommended crop?"}

    %% ----- GENERAL MODE -----
    Q -->|No| GEN["General (sensor-based) mode"]
    GEN --> GFERT["Fertilizer — TabNet<br/>sensor + weather only"]
    GEN --> GIRR["Irrigation — TTL FT-Transformer<br/>sensor + weather only"]
    GFERT --> GBADGE>"Badge: General (sensor-based)"]
    GIRR --> GBADGE

    %% ----- CROP-AWARE MODE -----
    Q -->|Yes| NORM["Crop label normalisation<br/>map lowercase label to encoder category<br/>agronomic fallback (e.g. apple → Fruits)"]
    NORM --> CA["Crop-aware mode"]
    CA --> CFERT["Fertilizer — TabNet<br/>crop supplied as encoded feature"]
    CA --> CIRR["Irrigation — TTL FT-Transformer<br/>crop embedding + FAO-56 Kc coefficient"]
    CFERT --> CBADGE>"Badge: Crop-aware · [crop name]"]
    CIRR --> CBADGE

    %% ----- STYLING -----
    classDef start fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef model fill:#f3e8ff,stroke:#9333ea,color:#581c87;
    classDef decision fill:#fef9c3,stroke:#ca8a04,color:#713f12;
    classDef general fill:#dbeafe,stroke:#2563eb,color:#1e3a8a;
    classDef cropaware fill:#ffe4e6,stroke:#e11d48,color:#881337;

    class START,FV start;
    class CROPMODEL,TOP3,GFERT,GIRR,CFERT,CIRR model;
    class Q decision;
    class GEN,GBADGE general;
    class NORM,CA,CBADGE cropaware;
```

---

## Export tips
- The `>"..."]` shape renders the two badges as flag/asymmetric nodes to make them stand out. If your Mermaid version complains, replace `GBADGE>"..."]` and `CBADGE>"..."]` with rectangular `GBADGE["..."]` and `CBADGE["..."]`.
- Keep `flowchart TD` (top-down) — it reads naturally as a decision flow. Switch to `LR` only if the page is wider than tall.
- Remove the `classDef`/`class` block for a plain black-and-white print version.
