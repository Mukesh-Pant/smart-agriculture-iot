# ML Model Setup Guide — Phase 7

## What Changed (Phase 7 Upgrade)

|                        | Phase 6 (old)          | Phase 7 (new)                                             |
| ---------------------- | ---------------------- | --------------------------------------------------------- |
| **Crop features**      | 7 raw sensor values    | 13 (7 raw + 6 engineered)                                 |
| **Fert features**      | 8                      | 13 (8 raw + 5 engineered)                                 |
| **Irrig features**     | 5                      | 10 (5 raw + 5 ET0-derived)                                |
| **Hyperparameters**    | Hardcoded defaults     | GridSearchCV 5-fold tuned                                 |
| **Probability scores** | Raw RF probabilities   | Calibrated (Platt sigmoid)                                |
| **Datasets**           | Manual CSV download    | Auto-generated from published distributions if CSV absent |
| **Irrigation logic**   | Simple threshold rules | FAO-56 ET0 evapotranspiration model                       |

## Feature Engineering Details

### Crop Model (13 features)

| Feature                             | Meaning                                        |
| ----------------------------------- | ---------------------------------------------- |
| N, P, K                             | Raw soil macronutrients (kg/ha)                |
| temperature, humidity, ph, rainfall | Environmental readings                         |
| npk_total                           | N+P+K sum — total nutrient availability        |
| n_to_p, n_to_k, p_to_k              | NPK balance ratios (Liebig's Law proxy)        |
| heat_index                          | temp × (1 – hum/200) — effective heat stress   |
| water_score                         | rainfall × humidity / 100 — water availability |

### Fertilizer Model (13 features)

| Feature                                  | Meaning                                  |
| ---------------------------------------- | ---------------------------------------- |
| Temperature, Humidity, Moisture          | Sensor readings                          |
| soil_enc, crop_enc                       | Label-encoded soil/crop type             |
| N, K, P                                  | Current soil nutrient levels             |
| npk_total                                | Total nutrient sum                       |
| n_deficiency, p_deficiency, k_deficiency | Deficit below optimal threshold          |
| moisture_temp                            | Moisture × Temp / 100 — interaction term |

### Irrigation Model (10 features)

| Feature                                               | Meaning                                                   |
| ----------------------------------------------------- | --------------------------------------------------------- |
| soil_moisture, temperature, humidity, ph, rainfall_mm | Sensor readings                                           |
| crop_type_enc, growth_stage_enc                       | Encoded crop/stage                                        |
| vpd_proxy                                             | (1 – hum/100) × temp — Vapour Pressure Deficit            |
| dryness                                               | (100–SM) × VPD / 50 — composite dryness index             |
| eff_rain                                              | rainfall × 0.75 — effective rainfall (FAO-56 coefficient) |

## Datasets Used

### Crop Recommendation

- **Primary**: `Crop_recommendation.csv` from Kaggle (ICFA dataset, 2200 rows, 22 crops)
  - Download: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
  - Place in: `ml/datasets/Crop_recommendation.csv`
- **Fallback**: If CSV not found, script generates 4600-row dataset from peer-reviewed
  crop-specific NPK/climate distributions (PMC 2024, ScienceDirect 2024)

### Fertilizer Recommendation

- **Primary**: `Fertilizer_Prediction.csv` from Kaggle (gdabhishek dataset)
  - Download: https://www.kaggle.com/datasets/gdabhishek/fertilizer-prediction
  - Place in: `ml/datasets/Fertilizer_Prediction.csv`
- **Fallback**: Generates 6000-row dataset from ICAR/FAO NPK application norms

### Irrigation Recommendation

- **Always generated** from FAO-56 ET0 decision rules (8000 samples)
- No public clean dataset exists for this task — generation is agronomically grounded

## How to Train

```bash
# From the backend/ directory with venv active
cd backend
python ml/train_models.py
```

Expected output:

```
── Model 1: Crop Recommendation ──────────────────────────
  GridSearchCV (5-fold) ... best: {...}
  CV F1 (weighted): 96.xx%
  Crop Recommendation Results
    Test accuracy   : 96.xx%
    F1-score  (w)   : 96.xx%

── Model 2: Fertilizer Recommendation ────────────────────
  ...
    Test accuracy   : 95.xx%

── Model 3: Irrigation Recommendation ────────────────────
  ...
    Test accuracy   : 94.xx%
```

## Saved Files

After training, `ml/saved_models/` contains:

```
crop_recommendation_model.joblib    ← CalibratedClassifierCV(RandomForest)
crop_label_encoder.joblib           ← LabelEncoder for crop names
crop_feature_scaler.joblib          ← StandardScaler (13 features)
crop_feature_names.joblib           ← Feature name list

fertilizer_recommendation_model.joblib
fertilizer_label_encoder.joblib
fertilizer_feature_scaler.joblib
fertilizer_feature_names.joblib
soil_type_encoder.joblib
crop_type_encoder.joblib

irrigation_recommendation_model.joblib
irrigation_label_encoder.joblib
irrigation_feature_scaler.joblib
irrigation_feature_names.joblib
irrig_crop_encoder.joblib
irrig_stage_encoder.joblib
```

## After Training

Restart the FastAPI server — it loads all models automatically on startup:

```
[ML] Loading enhanced recommendation models ...
[ML] Loaded: crop_recommendation_model.joblib
[ML] Loaded: fertilizer_recommendation_model.joblib
[ML] Loaded: irrigation_recommendation_model.joblib
[ML] 3/3 models ready.
```

## Committing Models

The `.joblib` files are binary and can be large. Options:

```bash
# Option A: commit them (simple, fine for academic project)
git add ml/saved_models/ ml/datasets/
git commit -m "feat(ml): Phase 7 — feature engineering, GridSearchCV, calibrated RF, ET0 irrigation model"

# Option B: use Git LFS for large files
git lfs track "*.joblib"
git add .gitattributes ml/saved_models/
git commit -m "feat(ml): add trained models via LFS"
```
