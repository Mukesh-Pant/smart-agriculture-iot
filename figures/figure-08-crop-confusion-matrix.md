# Figure 8: Crop Ensemble – Per-Class Classification Results (Confusion Matrix)

**Report location:** Section 6.1.1 — Crop Ensemble Recommendation Results
**Type:** True confusion matrix from the real trained model (not reconstructed from summary stats)
**Output file:** `figures/figure-08-crop-confusion-matrix.png` (300 DPI)
**Caption to use in report:** *Figure 8: Crop Ensemble – Per-Class Classification Results*

## How it was generated
The figure is produced by `backend/ml/make_result_figures.py`, which:
1. Reproduces the **exact** held-out test split used in training by replaying the same data assembly (real `Crop_recommendation.csv` for 14 Nepal crops + seeded synthetic samples for wheat/potato/mustard/soybean) under `np.random.seed(42)` and `train_test_split(..., random_state=42, stratify=y)`.
2. Loads the real trained artefacts: `crop_ensemble_model.joblib`, `crop_scaler.joblib`, `crop_encoder.joblib`, `crop_feature_names.joblib`.
3. Predicts on the reproduced 330-sample test set and **verifies** the result matches the saved report.

**Verification result:** reproduced test accuracy = **95.15%**, and every per-class precision/recall/F1/support matches `reports/crop_ensemble_recommendation_results.txt` exactly. The confusion matrix is therefore genuine.

## To regenerate
```
cd backend
.\venv\Scripts\python.exe ml\make_result_figures.py
```
(Outputs both Figure 8 and Figure 9 into the repo `figures/` folder.)

## What the matrix shows
A mostly-diagonal 18×18 matrix. The only off-diagonal confusions are the agronomically reasonable overlaps described in the report:
- **rice → jute** (overlapping humidity/rainfall): rice recall 0.73.
- **mustard ↔ wheat** (overlapping NPK/temperature): mustard recall 0.70, wheat precision 0.75.

All other 14 crops are classified perfectly (1.00 precision/recall/F1).

## Notes
- Colormap is `Greens`; change `cmap="Greens"` in the script for a different palette (e.g. `Blues`).
- For a row-normalised version (proportions instead of counts), add `normalize="true"` to `confusion_matrix(...)` and set `values_format=".2f"`.
