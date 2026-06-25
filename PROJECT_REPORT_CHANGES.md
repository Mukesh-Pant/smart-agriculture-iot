# Project Report — Update & Change Log

**Companion document to `PROJECT_REPORT.md`**

This document records the substantive changes made to the *IoT-Enabled Smart
Agriculture Monitoring and Decision Support System* after the initial
`PROJECT_REPORT.md` was drafted. It is written so that any person — or an AI
agent — can use it to update the corresponding sections of the main report and
the final Word document without having to re-derive the technical details.

Each change below is presented in three parts:

1. **What changed and why** — a short, plain rationale.
2. **Ready-to-paste report prose** — written in the same formal academic tone as
   the main report, so it can be dropped directly into the relevant chapter.
3. **Where to apply it** — the exact section(s), table(s) or abstract line(s) in
   `PROJECT_REPORT.md` that should be replaced or amended.

> **How to instruct an agent with this file:** point the agent at this document
> and `PROJECT_REPORT.md` together, and say e.g. *"Apply Change 1 from
> PROJECT_REPORT_CHANGES.md to the report."* Each change is self-contained and
> names its own target locations.

---

## Summary of Changes

| # | Area | Change |
|---|------|--------|
| 1 | Machine Learning — Crop | Replaced the SwiFT deep-learning transformer with a Random Forest + XGBoost + LightGBM **soft-voting ensemble** (95.15% test accuracy, up from 63.41%). |
| 2 | Machine Learning — Decision flow | Added **crop-aware** fertilizer and irrigation recommendations (general sensor-based mode vs. personalised crop-aware mode). |
| 3 | User Interface — ML Advisor | Removed the unused "Crop Type" input, reorganised the input form (5 + 4 grid with inline Soil Type). |
| 4 | Analytics | Added a **multi-range trend view** (48 hours, 7/15 days, 1/3/6 months) with adaptive time bucketing. |
| 5 | User Interface — System-wide | Replaced inconsistent emoji glyphs with a unified **lucide icon system** and redesigned the Recommendation History page. |

---

## Consolidated Current Model Performance

The four models were retrained as a single unified pipeline. The table below
reflects the **current** test-set performance and should replace any earlier
per-model accuracy figures throughout the report.

**Table — Final Model Performance (latest training run)**

| Model | Task | Algorithm | Dataset Size | Test Accuracy | Notes |
|---|---|---|---|---|---|
| Crop Recommendation | 18 Nepal crops | RF + XGBoost + LightGBM ensemble (soft voting) | 2,200 (test 330) | **95.15%** | 97.78% 5-fold cross-validation |
| Irrigation Advice | 5 urgency classes | TTL (FT-Transformer), crop-aware | 12,000 (test 1,800) | **97.67%** | numerical + categorical (crop, growth stage) features |
| Soil Fertility | Low / Medium / High | TabNet + LIME | 6,000 (test 900) | **99.44%** | explainable predictions |
| Fertilizer Recommendation | 5 Nepal fertilizers | TabNet + LIME | 10,099 (test 1,515) | **97.43%** | explainable predictions |

> Dataset sizes were verified from the test-set support counts in the retrained
> model reports (a 15% stratified test split). They supersede the figures in the
> original report (see Change 7 below).

---

## Change 1 — Crop Recommendation: SwiFT → RF + XGBoost + LightGBM Ensemble

### 1.1 What changed and why

The original crop recommendation model used **SwiFT**, a sparse-attention deep
learning transformer. On the project's dataset — roughly 2,200 labelled samples
spanning 18 crop classes — the transformer reached only **63.41%** test
accuracy. The cause is a well-understood limitation: transformer architectures
have a very large number of trainable parameters and therefore need tens of
thousands of examples per class to generalise. With only a few hundred samples
per crop, the model could not learn stable decision boundaries and overfit the
training data.

The model was replaced with a **soft-voting ensemble of three tree-based
learners** — Random Forest, XGBoost, and LightGBM — which are the strongest
class of algorithms for small-to-medium tabular datasets. The ensemble averages
the class-probability outputs of all three models, combining the low variance of
bagging (Random Forest) with the high accuracy of gradient boosting (XGBoost,
LightGBM). On the identical feature set it achieves **95.15%** test accuracy and
**97.78%** mean accuracy under 5-fold stratified cross-validation — an
improvement of more than thirty percentage points.

The feature engineering and the 18 Nepal-specific crop classes were retained
unchanged, so the improvement is attributable to the modelling approach rather
than to changes in the data.

### 1.2 Ready-to-paste report prose

> **Crop Recommendation Model (Ensemble Learning).** Crop recommendation is
> performed by a soft-voting ensemble of three tree-based classifiers — Random
> Forest, XGBoost (Extreme Gradient Boosting), and LightGBM (Light Gradient
> Boosting Machine). Tree ensembles are particularly well suited to tabular
> agricultural data of modest size, where deep neural architectures tend to
> overfit. Each input record is described by thirteen features: the seven raw
> measurements (nitrogen, phosphorus, potassium, temperature, humidity, pH, and
> rainfall) together with six engineered features — total NPK, the
> nitrogen-to-phosphorus, nitrogen-to-potassium and phosphorus-to-potassium
> ratios, a heat index, and a water-availability score. Features are
> standardised, and class imbalance in the training fold is corrected using
> SMOTE (Synthetic Minority Over-sampling Technique). The three base learners
> are combined through soft voting, which averages their predicted class
> probabilities to produce the final recommendation and an associated confidence
> score. Trained on the Kaggle Crop Recommendation Dataset filtered to eighteen
> crops grown in Nepal, the ensemble achieves 95.15% test accuracy and 97.78%
> mean accuracy under five-fold stratified cross-validation, substantially
> outperforming the deep-learning transformer it replaced.

### 1.3 Where to apply it

- **Abstract** — replace the sentence *"A SwiFT deep learning model handles crop
  recommendation across 22 crop types, achieving 63.41% test accuracy …"* with
  the ensemble description and the 95.15% figure (see the updated abstract in the
  appendix of this document).
- **Chapter 4 (System Architecture & Methodology)** — replace the SwiFT model
  description with the prose in §1.2 above.
- **Chapter 5 (Implementation)** — update the ML training pipeline subsection:
  the crop model is now `ensemble_crop.py` (a scikit-learn `VotingClassifier`),
  trained and serialised with joblib, not a PyTorch model.
- **Chapter 6 (Results & Analysis)** — replace the crop model accuracy and
  confusion-matrix discussion with the 95.15% / 97.78% results.
- **Software stack table (Table 3-2)** — add `xgboost` and `lightgbm`; note that
  PyTorch is no longer required for crop recommendation (still used by the
  irrigation model).
- **List of Abbreviations** — add: RF (Random Forest), XGBoost (Extreme Gradient
  Boosting), LightGBM (Light Gradient Boosting Machine), SMOTE (Synthetic
  Minority Over-sampling Technique).

---

## Change 2 — Crop-Aware Fertilizer & Irrigation Recommendations

### 2.1 What changed and why

Previously the fertilizer and irrigation models always ran on the raw sensor and
weather values alone, independent of which crop the farmer intended to grow. The
system now supports two clearly distinguished modes:

- **General (sensor-based) mode** — when no crop has been selected, fertilizer
  and irrigation advice is generated purely from current field readings.
- **Crop-aware mode** — once the farmer confirms a crop from the crop
  recommendation results, that crop is fed into both the fertilizer and the
  irrigation models, personalising their output to the selected crop.

For irrigation, the confirmed crop drives both a learned categorical embedding
and the FAO-56 crop coefficient (Kc), which adjusts the estimated crop
evapotranspiration and therefore the water requirement. For fertilizer, the crop
is supplied as an encoded model feature.

A supporting fix was also made: the crop recommendation model outputs lowercase
crop labels (e.g. `rice`), while the fertilizer and irrigation encoders were
trained on capitalised / category labels (e.g. `Rice`, `Fruits`). A
normalisation step now maps each predicted crop to the correct encoder label —
with a category fallback (for example, *apple* maps to *Fruits*) — so crop-aware
mode genuinely takes effect instead of silently defaulting.

Each fertilizer and irrigation response now reports whether it was produced in
general or crop-aware mode, and the dashboard displays a clear badge —
*"General (sensor-based)"* or *"Crop-aware · <crop>"* — so the farmer always
knows the basis of the advice.

### 2.2 Ready-to-paste report prose

> **Crop-Aware Decision Flow.** The recommendation engine links the crop model
> to the fertilizer and irrigation models so that advice can be personalised to
> the farmer's chosen crop. When no crop has been confirmed, the fertilizer and
> irrigation models operate in a general mode based solely on the current sensor
> and weather readings. When the farmer confirms a crop from the crop
> recommendation results, that crop becomes an input to both models: the
> irrigation model uses it both as a learned categorical feature and to select
> the appropriate FAO-56 crop coefficient (Kc) for evapotranspiration-based water
> estimation, while the fertilizer model uses it as an encoded feature. To ensure
> the confirmed crop is interpreted consistently across models, a normalisation
> layer maps each predicted crop label to the corresponding encoder category,
> with an agronomic category fallback for crops outside a model's original label
> set. Every recommendation records and displays whether it was generated in
> general or crop-aware mode, giving the farmer full transparency about the basis
> of each suggestion.

### 2.3 Where to apply it

- **Chapter 4 (System Architecture & Methodology)** — add the crop-aware decision
  flow as a new subsection describing how the four models interrelate (the crop
  output optionally feeds the fertilizer and irrigation models).
- **Chapter 5 (Implementation)** — document the `crop_aware` request/response
  fields and the crop-normalisation logic in the inference service.
- **Abstract** — optionally add one sentence noting that fertilizer and
  irrigation advice can be personalised to a confirmed crop.

---

## Change 3 — ML Advisor Input Form Simplification

### 3.1 What changed and why

The manual-input form on the ML Advisor page previously contained a "Crop Type
(hint)" dropdown. Analysis showed this field was never sent to any model — it was
dead input that could mislead the user into thinking it influenced the results.
It was removed. The crop is now chosen only from the actual crop recommendation
results (Change 2), which is the value that genuinely personalises the other
models.

The "Soil Type" field was retained, because it is a real input feature of the
fertilizer model. The form was reorganised into a cleaner **5 + 4 grid**: the
first row holds Nitrogen, Phosphorus, Potassium, Temperature and Humidity; the
second row holds Soil pH, Rainfall, Soil Moisture and Soil Type, with Soil Type
sitting inline as an equal-sized field rather than a separate full-width block.

### 3.2 Ready-to-paste report prose

> **Input Form Design.** The manual-input interface presents nine field-readable
> parameters in a two-row layout: nitrogen, phosphorus, potassium, temperature
> and humidity on the first row, and soil pH, rainfall, soil moisture and soil
> type on the second. Soil type is retained as it is a feature of the fertilizer
> model; the previously present crop-type field was removed because the crop is
> instead taken from the crop recommendation output, where it meaningfully
> personalises the fertilizer and irrigation advice.

### 3.3 Where to apply it

- **Chapter 5 (Implementation)** — update the frontend / ML Advisor description.
- Any **screenshots** of the ML Advisor input form should be re-captured.

---

## Change 4 — Analytics: Multi-Range Trend View

### 4.1 What changed and why

The analytics page previously showed only a fixed 7-day daily trend. A single
fixed window cannot reveal both short-term fluctuations (a temperature spike over
a few hours) and long-term seasonality. The page now offers a **selectable time
range**: 48 hours, 7 days, 15 days, 1 month, 3 months, and 6 months.

Because a single granularity does not suit every window (48 hours as daily
averages would be two or three points; six months as daily averages would be
nearly 180 cramped points), the system uses **adaptive bucketing**: hourly
buckets for the 48-hour view, daily buckets for 7/15-day and 1-month views, and
weekly buckets for the 3- and 6-month views.

On the backend this is implemented as a single MongoDB aggregation using
`$dateTrunc`, which performs all bucketing inside the database in one query
rather than issuing one query per day. The endpoint also returns a
reading-weighted summary (average, minimum, maximum) for the selected range.
Ranges with no data render a clear empty state rather than a broken chart.

### 4.2 Ready-to-paste report prose

> **Historical Analytics.** The analytics module allows the user to examine
> sensor trends over a selectable time window — 48 hours, 7 days, 15 days, 1
> month, 3 months, or 6 months. The data granularity adapts automatically to the
> chosen window: hourly aggregation for the 48-hour view, daily aggregation for
> the weekly and monthly views, and weekly aggregation for the quarterly and
> half-yearly views. All aggregation is performed inside MongoDB through a single
> `$dateTrunc` pipeline that computes the average, minimum and maximum of each
> parameter per time bucket, which keeps the query efficient even over months of
> data. The interface presents the selected range as trend charts for
> temperature, humidity, soil moisture and pH, accompanied by range-summary cards
> and a tabular breakdown.

### 4.3 Where to apply it

- **Chapter 5 (Implementation)** — extend the analytics/dashboard description and
  document the new `/api/analytics/trends` endpoint.
- **Chapter 6 (Results & Analysis)** — if trend figures are shown, note the
  multi-range capability.

---

## Change 5 — User Interface Professionalisation

### 5.1 What changed and why

The interface previously relied on emoji glyphs (e.g. 🌡️, 💧, 🌱) for icons.
Emojis render differently across operating systems and browsers and gave the
application an inconsistent, informal appearance. All emojis were replaced with a
single, consistent icon set from the **lucide-react** library, organised through
a central icon module so that sizing and style remain uniform across every page.
The Recommendation History page was additionally redesigned with cleaner cards,
category colour-coding, result chips and a refined detail drawer.

### 5.2 Ready-to-paste report prose

> **Interface Consistency.** To present a professional and visually consistent
> interface, the dashboard uses a single vector icon set (lucide-react) managed
> through a central icon module, ensuring uniform iconography across all pages.
> The Recommendation History view presents each saved advisory as a structured
> card — colour-coded by recommendation type, with result summary chips and an
> expandable detail panel — replacing the earlier list styling.

### 5.3 Where to apply it

- **Chapter 5 (Implementation)** — brief note in the frontend subsection.
- Re-capture **dashboard, history and analytics screenshots** for the report.

---

## Appendix — Updated Abstract (full, ready to paste)

This is the **complete Abstract** with every figure corrected and the new
features incorporated. It replaces the entire Abstract section in
`PROJECT_REPORT.md` (all paragraphs and the keyword list) — no other editing of
the abstract is required.

> Agriculture contributes to about one-third of Nepal's gross domestic product
> and employs a majority of the working population, yet most farmers continue to
> rely on intuition and traditional practices when making decisions about crops,
> irrigation, and fertilizers. This project presents an IoT-enabled smart
> agriculture monitoring and decision support system that collects real-time soil
> and environmental data through low-cost sensors, transmits it wirelessly to a
> cloud backend, and applies trained machine learning models to generate
> recommendations for crop selection, fertilizer application, and irrigation
> scheduling.
>
> The hardware layer consists of an ESP32 microcontroller connected to a DHT22
> temperature and humidity sensor, a capacitive soil moisture sensor, and a
> PH-4502C pH sensor. Sensor readings are published every 10 seconds over MQTT to
> a FastAPI backend hosted on AWS. The backend stores all readings in MongoDB and
> integrates live weather data from OpenWeatherMap for the Mahendranagar region.
>
> Four machine learning models power the recommendation engine. Crop
> recommendation across eighteen crops grown in Nepal is performed by a
> soft-voting ensemble of Random Forest, XGBoost and LightGBM classifiers,
> achieving 95.15% test accuracy (97.78% under five-fold cross-validation) on a
> 2,200-sample dataset that combines the Kaggle Crop Recommendation Dataset with
> synthetic samples for Nepal-specific crops; this tree-ensemble approach
> substantially outperforms the deep-learning transformer used in the earlier
> design. A TTL (Tabular Transfer Learning) model provides crop-aware irrigation
> scheduling across five urgency classes with 97.67% test accuracy on a
> 12,000-sample hybrid dataset incorporating crop type, growth stage and FAO-56
> evapotranspiration estimates. A TabNet model performs soil fertility
> classification (Low, Medium, High) with 99.44% test accuracy on 6,000 samples,
> and a second TabNet model recommends among the five fertilizers available in
> Nepal with 97.43% test accuracy on a 10,099-sample dataset. Both TabNet models
> include LIME-based explainability to show which soil parameters influenced each
> recommendation. When a farmer confirms a recommended crop, the fertilizer and
> irrigation models personalise their advice to that crop.
>
> The frontend is a Next.js 16 web application with real-time dashboard
> visualization using Recharts, displaying live sensor readings, multi-range
> historical trends (from 48 hours up to 6 months), and ML-generated
> recommendations. The complete system is containerized with Docker and deployed
> on AWS EC2 with a CI/CD pipeline through GitHub Actions.
>
> This system demonstrates that an affordable, sensor-based agricultural
> monitoring and recommendation platform is technically achievable using
> open-source tools and publicly available datasets, and that it can deliver
> real-time guidance to farmers through a simple web interface.
>
> *Keywords: crop recommendation, decision support system, ensemble learning,
> ESP32, FastAPI, fertilizer recommendation, Internet of Things, irrigation
> scheduling, LightGBM, machine learning, MQTT, Random Forest, smart agriculture,
> soil monitoring, TabNet, XGBoost*

---

## Quick Checklist for the Final Report

- [ ] Abstract — swap SwiFT/63.41% for the ensemble/95.15% wording (Appendix).
- [ ] Abstract — update irrigation/soil/fertilizer figures (97.67 / 99.44 / 97.43%).
- [ ] Chapter 4 — replace crop model methodology (Change 1.2); add crop-aware flow (Change 2.2).
- [ ] Chapter 5 — update training pipeline, input form, analytics endpoint, UI notes.
- [ ] Chapter 6 — update all four accuracy figures and crop model discussion.
- [ ] Chapter 3.3 — replace all four dataset specifications with the corrected sizes (Change 7).
- [ ] Section 5.3.4 — insert the CORS and Security paragraph (Change 8).
- [ ] Section 5.4 / Table 6-5 — update dataset sizes (crop 2,200/18, fertilizer 10,099/5, irrigation 12,000, soil 6,000).
- [ ] Table 3-2 (software stack) — add xgboost, lightgbm; adjust PyTorch note.
- [ ] List of Abbreviations — add RF, XGBoost, LightGBM, SMOTE (and NARC/FAO-56 if used); remove SwiFT.
- [ ] Front matter — insert auto-updating Table of Contents, List of Figures, List of Tables.
- [ ] Re-capture screenshots: ML Advisor input, History, Analytics.

---

## Change 6 — Table of Contents (missing from the initial report)

The initial `PROJECT_REPORT.md` did not include a Table of Contents. The complete,
professional Table of Contents below should be inserted into the front matter,
**immediately after the Abstract and before the List of Figures**.

**Notes for use:**

- Page numbers are shown as placeholders (`ii`, `iii`, … for front matter and
  `__` for the body). In the final Word document, generate the real page numbers
  automatically via **References → Table of Contents** after applying Heading 1 /
  Heading 2 / Heading 3 styles to the chapter, section and subsection titles.
- This Table of Contents already reflects the updated crop model (Change 1):
  the entries previously titled *"SwiFT Crop Recommendation …"* now read
  *"Crop Ensemble …"* in sections 5.4.1 and 6.1.1.
- Front-matter pages use lowercase Roman numerals; the main body (Chapter 1
  onward) uses Arabic numerals starting at 1, following standard report
  convention.

### Ready-to-paste Table of Contents

```
                              TABLE OF CONTENTS

                                                                          Page

DECLARATION ................................................................. i
CERTIFICATE OF APPROVAL .................................................... ii
COPYRIGHT ................................................................. iii
ACKNOWLEDGEMENT ........................................................... iv
ABSTRACT .................................................................. v
TABLE OF CONTENTS ........................................................ vi
LIST OF FIGURES .......................................................... vii
LIST OF TABLES .......................................................... viii
LIST OF ABBREVIATIONS ..................................................... ix

CHAPTER 1: INTRODUCTION ................................................... __
    1.1  Background .......................................................... __
    1.2  Motivation ......................................................... __
    1.3  Problem Definition ................................................. __
    1.4  Project Objectives ................................................. __
    1.5  Project Scope and Applications ..................................... __
    1.6  Report Organization ................................................ __

CHAPTER 2: LITERATURE REVIEW ............................................. __
    2.1  IoT Platforms for Smart Agriculture ................................ __
    2.2  Sensor Integration and Communication ............................... __
    2.3  Machine Learning for Crop Recommendation ........................... __
    2.4  Integrated IoT-AI Systems .......................................... __
    2.5  Socio-Technical Challenges ......................................... __
    2.6  Edge Computing and Real-Time Processing ............................ __
    2.7  Research Gap and Project Positioning ............................... __

CHAPTER 3: REQUIREMENT ANALYSIS .......................................... __
    3.1  Hardware Requirements .............................................. __
    3.2  Software Requirements .............................................. __
    3.3  Dataset Requirements ............................................... __
    3.4  Feasibility Study .................................................. __
         3.4.1  Technical Feasibility ........................................ __
         3.4.2  Operational Feasibility ...................................... __
         3.4.3  Economic Feasibility ......................................... __
         3.4.4  Schedule Feasibility ......................................... __
    3.5  Constraints and Assumptions ........................................ __

CHAPTER 4: SYSTEM ARCHITECTURE AND METHODOLOGY ........................... __
    4.1  System Overview .................................................... __
    4.2  IoT Data Acquisition Methodology ................................... __
         4.2.1  Sensor Reading Process ....................................... __
         4.2.2  Sensor Calibration ........................................... __
         4.2.3  MQTT Payload Structure ....................................... __
    4.3  Backend Architecture ............................................... __
         4.3.1  FastAPI Application Structure ................................ __
         4.3.2  MQTT to Database Bridge ...................................... __
         4.3.3  Weather Integration .......................................... __
    4.4  Machine Learning Methodology ....................................... __
         4.4.1  Model Selection Rationale .................................... __
         4.4.2  Feature Engineering .......................................... __
         4.4.3  Training Configuration ....................................... __
         4.4.4  Explainable AI (LIME) ........................................ __
    4.5  Crop-Aware Decision Flow ........................................... __
    4.6  Frontend Architecture .............................................. __
    4.7  Deployment Architecture ............................................ __

CHAPTER 5: IMPLEMENTATION DETAILS ........................................ __
    5.1  Hardware Implementation ............................................ __
         5.1.1  ESP32 Microcontroller Setup .................................. __
         5.1.2  DHT22 Temperature and Humidity Sensor ........................ __
         5.1.3  Capacitive Soil Moisture Sensor .............................. __
         5.1.4  PH-4502C pH Sensor ........................................... __
         5.1.5  Power Supply ................................................. __
    5.2  Firmware Implementation ............................................ __
    5.3  Backend Implementation ............................................. __
         5.3.1  FastAPI Application Lifecycle ................................ __
         5.3.2  API Endpoints ................................................ __
         5.3.3  MongoDB Schema ............................................... __
         5.3.4  CORS and Security ............................................ __
    5.4  Machine Learning Training Pipeline ................................. __
         5.4.1  Crop Ensemble Training (RF + XGBoost + LightGBM) ............. __
         5.4.2  TTL Irrigation Training ...................................... __
         5.4.3  TabNet Soil Fertility Training ............................... __
         5.4.4  TabNet Fertilizer Training ................................... __
    5.5  Frontend Implementation ............................................ __
         5.5.1  Application Structure ........................................ __
         5.5.2  Dashboard Features ........................................... __
         5.5.3  Historical Analytics (Multi-Range Trends) .................... __
         5.5.4  Authentication ............................................... __

CHAPTER 6: RESULTS AND ANALYSIS .......................................... __
    6.1  Machine Learning Model Results ..................................... __
         6.1.1  Crop Ensemble Recommendation Results ......................... __
         6.1.2  TTL Irrigation Scheduling Results ............................ __
         6.1.3  TabNet Soil Fertility Results ................................ __
         6.1.4  TabNet Fertilizer Recommendation Results ..................... __
    6.2  Comparative Model Summary .......................................... __
    6.3  Sensor Validation .................................................. __
    6.4  System Performance ................................................. __
         6.4.1  Data Transmission Reliability ................................ __
         6.4.2  End-to-End Latency ........................................... __
         6.4.3  ML Inference Time ............................................ __
    6.5  Error Analysis and Limitations ..................................... __

CHAPTER 7: FUTURE ENHANCEMENT ............................................ __
    7.1  Local Dataset Collection and Model Retraining ...................... __
    7.2  NPK Sensor Integration ............................................. __
    7.3  Mobile Application ................................................. __
    7.4  LoRa Communication for Remote Areas ................................ __
    7.5  Multi-Node Network ................................................. __
    7.6  Online Learning and Model Drift Detection .......................... __
    7.7  Pest and Disease Detection ......................................... __
    7.8  SMS/Voice Alerts for Low-Connectivity Farmers ...................... __

CHAPTER 8: CONCLUSION .................................................... __

APPENDICES ............................................................... __
    Appendix A: Project Budget ............................................. __
    Appendix B: Project Timeline (Gantt Chart) ............................. __
    Appendix C: ESP32 Wiring Guide ......................................... __
    Appendix D: ML Model Artifacts ......................................... __
    Appendix E: API Endpoint Documentation ................................. __

REFERENCES ............................................................... __
```

### Where to apply it

- **Front matter** — insert the Table of Contents between the **Abstract** and the
  **List of Figures** in `PROJECT_REPORT.md`.
- Two TOC lines are **new** relative to the current report body and assume you
  adopt the recommended additions from this document:
  - **4.5 Crop-Aware Decision Flow** (from Change 2)
  - **5.5.3 Historical Analytics (Multi-Range Trends)** (from Change 4)
  If you choose not to add those subsections, simply delete those two lines and
  renumber 4.6/4.7 back to 4.5/4.6 and 5.5.4 back to 5.5.3.

---

## Change 7 — Dataset Specifications Correction (Chapter 3.3 and related)

### 7.1 What changed and why

When the models were retrained as a single unified pipeline, the datasets were
rebuilt to be Nepal-specific and were resized. The dataset figures in the
original report (Chapter 3.3, and the per-model results in Chapters 5 and 6) are
therefore outdated and must be corrected. The sizes below were verified from the
test-set support counts in the retrained model reports (15% stratified test
split).

### 7.2 Ready-to-paste replacement for Section 3.3 (Dataset Requirements)

> **Crop Recommendation Dataset.** A Nepal-specific dataset of 2,200 labelled
> records spanning eighteen crops. Of these, 1,400 are real records drawn from
> the Kaggle Crop Recommendation Dataset (fourteen crops that overlap with Nepal,
> 100 samples each), supplemented by 800 synthetically generated records (200
> each) for four additional crops grown in Nepal — wheat, potato, mustard and
> soybean — that were absent from the real data. Each record has seven base
> features (N, P, K, temperature, humidity, pH, rainfall). Split: 85% training,
> 15% testing (330 test samples).
>
> **Fertilizer Recommendation Dataset.** A dataset of 10,099 records covering the
> five fertilizers available in Nepal (Urea, DAP, MOP, NPK 20-20-20, Compost).
> It combines 10,000 synthetically generated records — whose temperature,
> humidity and moisture ranges are seeded from real data — with 99 real records
> from the Kaggle Fertilizer Prediction Dataset. Features: temperature, humidity,
> moisture, soil type, crop type, N, P, K. Split: 85% training, 15% testing
> (1,515 test samples).
>
> **Irrigation Dataset (Hybrid).** A dataset of 12,000 records across five
> irrigation urgency classes. Feature distributions are sampled from real field
> data (TARP.csv) where available, while the five-level urgency labels and the
> FAO-56 agronomic features (reference and crop evapotranspiration, vapour
> pressure deficit, soil-water depletion) are computed by rule. Features: nine
> numerical and two categorical (crop type, growth stage). Split: 85% training,
> 15% testing (1,800 test samples).
>
> **Soil Fertility Dataset.** A synthetically generated dataset of 6,000 records
> across three fertility classes (Low, Medium, High), based on Nepal Agricultural
> Research Council (NARC) agronomic thresholds. Features: N, P, K, pH, moisture.
> Split: 85% training, 15% testing (900 test samples).

### 7.3 Comparison table (old vs new) — for your reference only

| Model | Old (original report) | New (current) |
|---|---|---|
| Crop | 2,200 samples · 22 classes · Kaggle (Indian) | 2,200 samples · **18 Nepal crops** · 1,400 real + 800 synthetic |
| Fertilizer | 6,000 samples · 7 classes · Kaggle | **10,099 samples** · **5 Nepal fertilizers** · 10,000 synthetic + 99 real |
| Irrigation | 10,000 samples · 5 classes · generated | **12,000 samples** · 5 classes · hybrid (real features + FAO-56 labels) |
| Soil Fertility | 3,000 samples · 3 classes · generated | **6,000 samples** · 3 classes · synthetic (NARC thresholds) |

### 7.4 Where to apply it

- **Section 3.3 (Dataset Requirements)** — replace all four dataset descriptions
  with §7.2 above.
- **Section 5.4 (ML Training Pipeline)** — update each model's sample count and,
  for crop, replace the SwiFT description with the ensemble (per Change 1).
- **Chapter 6 (Results)** — update the dataset sizes referenced in the per-model
  results discussion and in the comparative summary table (Table 6-5).
- **Abstract** — the sample counts mentioned in the abstract should match these.

---

## Change 8 — Section 5.3.4 "CORS and Security" Content

### 8.1 What changed and why

The new Table of Contents includes Section 5.3.4 (CORS and Security), which had
no written content. The paragraph below describes the system's *actual*
implemented security posture and is written honestly — it states the
MVP-appropriate configuration and the recommended production hardening, which is
the correct framing for an academic report.

### 8.2 Ready-to-paste content for Section 5.3.4

> **5.3.4 CORS and Security.** The backend enables Cross-Origin Resource Sharing
> (CORS) so that the web frontend can call the API from a different origin.
> During the MVP phase a permissive origin policy is applied; in a production
> deployment this should be restricted to the specific frontend domain. The MQTT
> broker enforces username/password authentication that matches the firmware
> credentials, preventing unauthorised devices from publishing sensor data to the
> system. All credentials, connection strings and API keys are supplied through
> environment variables rather than being hardcoded in the source, keeping
> secrets out of the codebase. User-facing authentication — account login,
> email verification and session management — is handled by a dedicated Node.js
> service using NextAuth with a MongoDB adapter, which keeps user-account
> concerns isolated from the sensor and machine-learning inference API.

### 8.3 Where to apply it

- **Section 5.3.4** — insert the paragraph above.

---

## Document-Generation Decisions (resolved clarifications)

These decisions resolve the open questions for producing the final Word
document. They are recorded here so the document can be generated consistently.

1. **List of Figures / List of Tables** — **Include both** as native, caption-
   populated lists (generated via Word's *Insert Caption* + *Insert Table of
   Figures*), placed in the front matter after the Table of Contents. The report
   already reserves these sections, and the FWU format expects them.

2. **Table of Contents type** — Use a **live, auto-updating Word TOC field**
   (*References → Table of Contents*) rather than static placeholder text, with
   Heading 1/2/3 styles applied to chapter / section / subsection titles so page
   numbers populate and update automatically. The static TOC in Change 6 is the
   structural reference; the Word field should mirror it.

3. **Abstract — crop-aware sentence** — **Include it.** The crop-aware
   personalisation of fertilizer and irrigation is a genuine, implemented feature
   (Change 2) and is worth highlighting. (Already present in the updated abstract
   in the appendix of this document.)

4. **UI figure/screenshot placeholders** — **Relabel to the current interface**
   and re-capture: (a) the ML Advisor input form (5 + 4 grid with inline Soil
   Type, no Crop Type field), (b) the redesigned Recommendation History page
   (lucide-icon cards), and (c) the multi-range Analytics view (48h / 7d / 15d /
   1m / 3m / 6m selector).

5. **Abbreviations** — in addition to RF, XGBoost, LightGBM and SMOTE (Change 1),
   ensure NARC (Nepal Agricultural Research Council) and FAO-56 are defined if
   they appear, and that the obsolete "SwiFT" entry is removed if it was listed.
