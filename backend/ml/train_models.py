# =============================================================
# ml/train_models.py — ML Model Training Script
#
# Run this script ONCE to train and save all three models:
#   1. Crop Recommendation      (Random Forest Classifier)
#   2. Fertilizer Recommendation (Random Forest Classifier)
#   3. Irrigation Recommendation (Random Forest Classifier)
#
# Usage (from backend/ folder with venv active):
#   python ml/train_models.py
#
# Output: saves .joblib files to ml/saved_models/
# These files are then loaded by the ML service at runtime.
#
# Datasets used:
#   - Crop_recommendation.csv   (N, P, K, temp, humidity, pH, rainfall → crop)
#   - Fertilizer_Prediction.csv (soil type, crop type, N, P, K, temp,
#                                 humidity, moisture → fertilizer)
#   - Irrigation data derived from sensor readings
# =============================================================

import os
import sys
import numpy as np
import pandas as pd
import joblib
import warnings

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix
)

warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")
MODELS_DIR  = os.path.join(BASE_DIR, "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)

print("=" * 60)
print("  Smart Agriculture — ML Model Training")
print("=" * 60)


# =============================================================
# HELPER FUNCTIONS
# =============================================================

def save_model(obj, filename: str):
    path = os.path.join(MODELS_DIR, filename)
    joblib.dump(obj, path)
    size_kb = os.path.getsize(path) / 1024
    print(f"  ✅ Saved: {filename} ({size_kb:.1f} KB)")


def load_csv(filename: str) -> pd.DataFrame:
    path = os.path.join(DATASET_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"\n❌ Dataset not found: {path}\n"
            f"   Download it and place it in: {DATASET_DIR}/\n"
            f"   See SETUP_ML.md for download links."
        )
    df = pd.read_csv(path)
    print(f"  Loaded: {filename} — {len(df)} rows, {len(df.columns)} columns")
    return df


def evaluate_model(model, X_test, y_test, name: str):
    y_pred   = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    cv_score = cross_val_score(model, X_test, y_test, cv=3, scoring="accuracy")
    print(f"\n  📊 {name} Evaluation:")
    print(f"     Test Accuracy  : {accuracy * 100:.2f}%")
    print(f"     CV Score (3-fold): {cv_score.mean() * 100:.2f}% ± {cv_score.std() * 100:.2f}%")
    return accuracy


# =============================================================
# MODEL 1 — CROP RECOMMENDATION
# =============================================================
# Dataset: Crop_recommendation.csv
# Features: N, P, K, temperature, humidity, ph, rainfall
# Target:   label (crop name — 22 crops)
#
# Source: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
# =============================================================

print("\n── Model 1: Crop Recommendation ─────────────────────────")

try:
    df_crop = load_csv("Crop_recommendation.csv")

    # Standardise column names (handle different CSV formats)
    df_crop.columns = df_crop.columns.str.strip().str.lower()

    # Expected columns
    crop_features = ["n", "p", "k", "temperature", "humidity", "ph", "rainfall"]
    crop_target   = "label"

    # Validate columns exist
    missing = [c for c in crop_features + [crop_target] if c not in df_crop.columns]
    if missing:
        raise ValueError(f"Missing columns in Crop_recommendation.csv: {missing}")

    X_crop = df_crop[crop_features].values
    y_crop = df_crop[crop_target].values

    # Encode crop labels to integers
    crop_encoder = LabelEncoder()
    y_crop_enc   = crop_encoder.fit_transform(y_crop)

    print(f"  Classes ({len(crop_encoder.classes_)}): {list(crop_encoder.classes_)}")

    # Scale features
    crop_scaler = StandardScaler()
    X_crop_scaled = crop_scaler.fit_transform(X_crop)

    # Train/test split
    X_tr, X_te, y_tr, y_te = train_test_split(
        X_crop_scaled, y_crop_enc,
        test_size=0.2, random_state=42, stratify=y_crop_enc
    )

    # Train Random Forest
    print("  Training Random Forest (200 trees)...")
    crop_model = RandomForestClassifier(
        n_estimators  = 200,
        max_depth     = None,
        min_samples_split = 2,
        min_samples_leaf  = 1,
        random_state  = 42,
        n_jobs        = -1      # use all CPU cores
    )
    crop_model.fit(X_tr, y_tr)

    accuracy = evaluate_model(crop_model, X_te, y_te, "Crop Recommendation")

    # Save
    save_model(crop_model,   "crop_recommendation_model.joblib")
    save_model(crop_encoder, "crop_label_encoder.joblib")
    save_model(crop_scaler,  "crop_feature_scaler.joblib")

    print(f"\n  Feature importances (Crop Model):")
    for feat, imp in sorted(
        zip(crop_features, crop_model.feature_importances_),
        key=lambda x: -x[1]
    ):
        bar = "█" * int(imp * 40)
        print(f"    {feat:15s} {bar} {imp:.4f}")

except FileNotFoundError as e:
    print(e)
    print("  ⚠️  Skipping crop model — dataset not found.")
except Exception as e:
    print(f"  ❌ Crop model training failed: {e}")


# =============================================================
# MODEL 2 — FERTILIZER RECOMMENDATION
# =============================================================
# Dataset: Fertilizer_Prediction.csv
# Features: Temperature, Humidity, Moisture, Soil_Type,
#           Crop_Type, Nitrogen, Potassium, Phosphorous
# Target:   Fertilizer_Name
#
# Source: https://www.kaggle.com/datasets/gdabhishek/fertilizer-prediction
# =============================================================

print("\n── Model 2: Fertilizer Recommendation ───────────────────")

try:
    df_fert = load_csv("Fertilizer_Prediction.csv")
    df_fert.columns = df_fert.columns.str.strip()

    # Normalise common column name variations
    rename_map = {
        "Temparature": "Temperature",
        "Nitrogen":    "N",
        "Phosphorous": "P",
        "Potassium":   "K",
    }
    df_fert = df_fert.rename(columns=rename_map)

    # Encode categorical features
    soil_encoder = LabelEncoder()
    crop_type_encoder = LabelEncoder()
    fert_encoder = LabelEncoder()

    df_fert["Soil_Type_enc"]  = soil_encoder.fit_transform(df_fert["Soil_Type"].astype(str))
    df_fert["Crop_Type_enc"]  = crop_type_encoder.fit_transform(df_fert["Crop_Type"].astype(str))
    y_fert = fert_encoder.fit_transform(df_fert["Fertilizer_Name"].astype(str))

    fert_features = [
        "Temperature", "Humidity", "Moisture",
        "Soil_Type_enc", "Crop_Type_enc",
        "N", "K", "P"
    ]

    # Validate
    missing = [c for c in fert_features if c not in df_fert.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    X_fert = df_fert[fert_features].values

    fert_scaler  = StandardScaler()
    X_fert_scaled = fert_scaler.fit_transform(X_fert)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X_fert_scaled, y_fert,
        test_size=0.2, random_state=42, stratify=y_fert
    )

    print(f"  Fertilizers ({len(fert_encoder.classes_)}): {list(fert_encoder.classes_)}")
    print("  Training Random Forest (200 trees)...")

    fert_model = RandomForestClassifier(
        n_estimators=200, random_state=42, n_jobs=-1
    )
    fert_model.fit(X_tr, y_tr)

    evaluate_model(fert_model, X_te, y_te, "Fertilizer Recommendation")

    save_model(fert_model,        "fertilizer_recommendation_model.joblib")
    save_model(fert_encoder,      "fertilizer_label_encoder.joblib")
    save_model(fert_scaler,       "fertilizer_feature_scaler.joblib")
    save_model(soil_encoder,      "soil_type_encoder.joblib")
    save_model(crop_type_encoder, "crop_type_encoder.joblib")

except FileNotFoundError as e:
    print(e)
    print("  ⚠️  Skipping fertilizer model — dataset not found.")
except Exception as e:
    print(f"  ❌ Fertilizer model training failed: {e}")


# =============================================================
# MODEL 3 — IRRIGATION RECOMMENDATION
# =============================================================
# We generate a synthetic but realistic dataset for irrigation
# because no single well-known public dataset exists.
#
# Features: soil_moisture_pct, temperature_c, humidity_pct,
#           ph_value, rainfall_mm
# Target:   irrigation_action
#   0 = "no_irrigation"   (soil is wet enough)
#   1 = "light_irrigation" (borderline — add a little water)
#   2 = "heavy_irrigation" (soil is dry — water urgently)
#
# Rule-based generation ensures agronomically correct labels.
# =============================================================

print("\n── Model 3: Irrigation Recommendation ───────────────────")

try:
    np.random.seed(42)
    n_samples = 5000

    # Generate realistic sensor ranges
    soil_moisture = np.random.uniform(5,  95,  n_samples)
    temperature   = np.random.uniform(10, 45,  n_samples)
    humidity      = np.random.uniform(20, 100, n_samples)
    ph_value      = np.random.uniform(4,  9,   n_samples)
    rainfall_mm   = np.random.uniform(0,  200, n_samples)

    # Rule-based label generation
    # Based on agronomic thresholds:
    #   - Moisture < 30% AND rainfall < 20mm → heavy irrigation
    #   - Moisture 30–50% AND rainfall < 50mm → light irrigation
    #   - Otherwise → no irrigation
    labels = []
    for sm, temp, hum, ph, rain in zip(
        soil_moisture, temperature, humidity, ph_value, rainfall_mm
    ):
        if sm < 30 and rain < 20:
            labels.append(2)   # heavy_irrigation
        elif sm < 50 and rain < 50:
            labels.append(1)   # light_irrigation
        else:
            labels.append(0)   # no_irrigation

    y_irrig = np.array(labels)

    irrig_encoder = LabelEncoder()
    irrig_encoder.classes_ = np.array(["heavy_irrigation", "light_irrigation", "no_irrigation"])

    X_irrig = np.column_stack([
        soil_moisture, temperature, humidity, ph_value, rainfall_mm
    ])

    irrig_scaler   = StandardScaler()
    X_irrig_scaled = irrig_scaler.fit_transform(X_irrig)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X_irrig_scaled, y_irrig,
        test_size=0.2, random_state=42
    )

    print(f"  Generated {n_samples} synthetic samples.")
    unique, counts = np.unique(y_irrig, return_counts=True)
    action_names = ["no_irrigation", "light_irrigation", "heavy_irrigation"]
    for u, c in zip(unique, counts):
        print(f"    {action_names[u]:20s}: {c} samples ({c/n_samples*100:.1f}%)")

    print("  Training Random Forest (200 trees)...")

    irrig_model = RandomForestClassifier(
        n_estimators=200, random_state=42, n_jobs=-1
    )
    irrig_model.fit(X_tr, y_tr)

    evaluate_model(irrig_model, X_te, y_te, "Irrigation Recommendation")

    save_model(irrig_model,   "irrigation_recommendation_model.joblib")
    save_model(irrig_encoder, "irrigation_label_encoder.joblib")
    save_model(irrig_scaler,  "irrigation_feature_scaler.joblib")

except Exception as e:
    print(f"  ❌ Irrigation model training failed: {e}")


# =============================================================
# SUMMARY
# =============================================================
print("\n" + "=" * 60)
print("  Training Complete — Saved Models:")
print("=" * 60)
saved = os.listdir(MODELS_DIR)
for f in sorted(saved):
    size = os.path.getsize(os.path.join(MODELS_DIR, f)) / 1024
    print(f"  📦 {f:50s} {size:8.1f} KB")

print("\n✅ All models saved to ml/saved_models/")
print("   Start the FastAPI server — ML service will load them automatically.")
print("=" * 60)
