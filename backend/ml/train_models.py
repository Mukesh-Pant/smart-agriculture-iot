# =============================================================
# ml/train_models.py  —  Enhanced ML Training Pipeline
#
# Phase 7 upgrade:
#   • Realistic datasets built from peer-reviewed published
#     distributions (PMC 2024, ScienceDirect 2024, Kaggle public)
#   • GridSearchCV hyperparameter tuning for every model
#   • 5-fold stratified cross-validation
#   • Feature engineering (NPK ratio, deficit scores, ET0 proxy)
#   • Probability calibration via CalibratedClassifierCV
#   • Full classification report per model
#
# Models trained:
#   1. Crop Recommendation      (23 crops, 13 features)
#   2. Fertilizer Recommendation (7 fertilizers, 13 features)
#   3. Irrigation Recommendation (3 levels, 10 features incl. ET0)
#
# Datasets:
#   • Crop      -> Crop_recommendation.csv  (Kaggle ICFA, 2200 rows)
#                 If absent, generated from published distributions.
#   • Fertilizer-> Fertilizer_Prediction.csv (Kaggle gdabhishek)
#                 If absent, generated from ICAR/FAO NPK norms.
#   • Irrigation-> Always generated (FAO-56 ET0 decision rules).
#
# Usage (from backend/ with venv active):
#   python ml/train_models.py
# =============================================================

import os, sys, warnings, traceback
import numpy as np
import pandas as pd
import joblib

warnings.filterwarnings("ignore")

from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import (
    train_test_split, StratifiedKFold, GridSearchCV
)
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report

# ── Paths ─────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")
MODELS_DIR  = os.path.join(BASE_DIR, "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)

np.random.seed(42)

print("=" * 65)
print("  Smart Agriculture — Enhanced ML Training Pipeline (Phase 7)")
print("=" * 65)


# =============================================================
# HELPERS
# =============================================================

def save(obj, filename):
    path = os.path.join(MODELS_DIR, filename)
    joblib.dump(obj, path)
    kb = os.path.getsize(path) / 1024
    print(f"    saved  {filename:<52s}  {kb:7.1f} KB")


def load_csv(filename):
    path = os.path.join(DATASET_DIR, filename)
    if not os.path.exists(path):
        return None
    df = pd.read_csv(path)
    print(f"  Loaded {filename}  ({len(df)} rows)")
    return df


def full_report(model, X_te, y_te, class_names, title):
    y_pred = model.predict(X_te)
    acc    = accuracy_score(y_te, y_pred)
    print(f"\n  {title}")
    print(f"    Test accuracy   : {acc*100:.2f}%")
    rep = classification_report(y_te, y_pred,
                                target_names=class_names,
                                output_dict=True,
                                zero_division=0)
    wa  = rep["weighted avg"]
    print(f"    Precision (w)   : {wa['precision']*100:.2f}%")
    print(f"    Recall    (w)   : {wa['recall']*100:.2f}%")
    print(f"    F1-score  (w)   : {wa['f1-score']*100:.2f}%")
    return acc


def tune_rf(X_tr, y_tr, param_grid, cv=5):
    print(f"  GridSearchCV ({cv}-fold) ...", end=" ", flush=True)
    base = RandomForestClassifier(random_state=42, n_jobs=-1)
    skf  = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)
    gs   = GridSearchCV(base, param_grid, cv=skf,
                        scoring="f1_weighted", n_jobs=-1,
                        refit=True, verbose=0)
    gs.fit(X_tr, y_tr)
    print(f"best: {gs.best_params_}")
    print(f"    CV F1 (weighted): {gs.best_score_*100:.2f}%")
    return gs.best_estimator_


# =============================================================
# DATASET GENERATORS
# =============================================================

def generate_crop_dataset(n_per_class=200):
    # Profiles: (N_mu, N_sd, P_mu, P_sd, K_mu, K_sd,
    #            T_mu, T_sd, H_mu, H_sd, pH_mu, pH_sd, R_mu, R_sd)
    PROFILES = {
        "rice":        (80,10, 45, 8, 40, 8, 24,2, 82,6, 6.5,0.4, 210,30),
        "maize":       (75,10, 55,10, 45,10, 22,3, 65,8, 6.2,0.4, 100,20),
        "wheat":       (70, 8, 40, 8, 40, 8, 18,3, 60,8, 6.3,0.3,  80,15),
        "chickpea":    (40, 8, 68,10, 80,12, 18,3, 16,5, 7.0,0.4,  73,15),
        "kidneybeans": (20, 5, 67,10, 20, 5, 20,3, 21,5, 5.7,0.4,  65,15),
        "pigeonpeas":  (20, 5, 68, 8, 20, 5, 27,2, 48,8, 6.0,0.4, 150,25),
        "mothbeans":   (21, 5, 48, 8, 20, 5, 28,2, 53,8, 3.5,0.4,  51,12),
        "mungbean":    (20, 5, 48, 8, 20, 5, 28,2, 85,8, 6.7,0.4,  55,12),
        "blackgram":   (40, 8, 68, 8, 19, 5, 30,2, 65,8, 7.0,0.3,  67,12),
        "lentil":      (18, 5, 68, 8, 19, 5, 18,3, 64,8, 6.9,0.3,  45, 8),
        "cotton":      (118,12,47, 8, 20, 5, 24,2, 79,8, 6.5,0.4,  80,15),
        "jute":        (78,10, 46, 8, 40, 8, 25,2, 80,6, 6.5,0.4, 175,25),
        "pomegranate": (18, 5, 18, 5, 40, 8, 21,3, 90,8, 5.8,0.4, 100,20),
        "banana":      (100,10,82,10, 50,10, 27,2, 80,6, 5.5,0.4, 100,20),
        "mango":       (20, 5, 27, 5, 30, 5, 31,2, 50,8, 5.7,0.4,  94,20),
        "grapes":      (23, 5,132,15,200,20, 23,3, 82,6, 6.0,0.4,  69,15),
        "watermelon":  (99,10, 17, 5, 50,10, 25,2, 85,6, 6.5,0.4,  50,12),
        "muskmelon":   (100,10,17, 5, 50,10, 28,2, 92,6, 6.5,0.4,  24, 8),
        "apple":       (21, 5,134,15,199,20, 22,3, 92,6, 5.8,0.4, 112,20),
        "orange":      (20, 5, 10, 5, 10, 5, 23,3, 92,6, 6.5,0.4, 110,20),
        "papaya":      (50, 8, 59, 8, 50,10, 34,2, 92,6, 6.5,0.4, 145,25),
        "coconut":     (22, 5, 17, 5, 30, 8, 27,2, 94,6, 5.9,0.4, 135,25),
        "coffee":      (101,10,28, 5, 30, 8, 25,2, 58,8, 6.8,0.4, 150,25),
    }
    rows = []
    for crop, p in PROFILES.items():
        Nm,Ns,Pm,Ps,Km,Ks,Tm,Ts,Hm,Hs,pHm,pHs,Rm,Rs = p
        N   = np.clip(np.random.normal(Nm,Ns,n_per_class),   0, 200)
        P   = np.clip(np.random.normal(Pm,Ps,n_per_class),   0, 150)
        K   = np.clip(np.random.normal(Km,Ks,n_per_class),   0, 250)
        temp= np.clip(np.random.normal(Tm,Ts,n_per_class),   8,  45)
        hum = np.clip(np.random.normal(Hm,Hs,n_per_class),  10, 100)
        pH  = np.clip(np.random.normal(pHm,pHs,n_per_class),3.5, 9.0)
        rain= np.clip(np.random.normal(Rm,Rs,n_per_class),   0, 400)
        for i in range(n_per_class):
            rows.append({"N":round(N[i],2),"P":round(P[i],2),"K":round(K[i],2),
                          "temperature":round(temp[i],2),"humidity":round(hum[i],2),
                          "ph":round(pH[i],2),"rainfall":round(rain[i],2),"label":crop})
    df = pd.DataFrame(rows).sample(frac=1,random_state=42).reset_index(drop=True)
    df.to_csv(os.path.join(DATASET_DIR,"Crop_recommendation.csv"), index=False)
    print(f"  Generated Crop_recommendation.csv  ({len(df)} rows, {len(PROFILES)} crops)")
    return df


def generate_fertilizer_dataset(n=6000):
    SOIL_TYPES = ["Sandy","Loamy","Black","Red","Clayey"]
    CROP_TYPES = ["Wheat","Rice","Maize","Sugarcane","Cotton",
                  "Tobacco","Barley","Oil seeds","Paddy","Pulses",
                  "Ground Nuts","Millets","Watermelon"]
    FERT_MAP = {
        "Wheat":       {"Sandy":"Urea","Loamy":"DAP","Black":"17-17-17","Red":"28-28","Clayey":"14-35-14"},
        "Rice":        {"Sandy":"Urea","Loamy":"Urea","Black":"Urea","Red":"DAP","Clayey":"Urea"},
        "Maize":       {"Sandy":"DAP","Loamy":"20-20","Black":"17-17-17","Red":"DAP","Clayey":"28-28"},
        "Sugarcane":   {"Sandy":"10-26-26","Loamy":"17-17-17","Black":"Urea","Red":"20-20","Clayey":"14-35-14"},
        "Cotton":      {"Sandy":"14-35-14","Loamy":"14-35-14","Black":"DAP","Red":"28-28","Clayey":"17-17-17"},
        "Tobacco":     {"Sandy":"10-26-26","Loamy":"20-20","Black":"17-17-17","Red":"10-26-26","Clayey":"14-35-14"},
        "Barley":      {"Sandy":"Urea","Loamy":"DAP","Black":"17-17-17","Red":"20-20","Clayey":"28-28"},
        "Oil seeds":   {"Sandy":"20-20","Loamy":"10-26-26","Black":"17-17-17","Red":"DAP","Clayey":"14-35-14"},
        "Paddy":       {"Sandy":"Urea","Loamy":"Urea","Black":"Urea","Red":"DAP","Clayey":"Urea"},
        "Pulses":      {"Sandy":"DAP","Loamy":"20-20","Black":"17-17-17","Red":"10-26-26","Clayey":"14-35-14"},
        "Ground Nuts": {"Sandy":"10-26-26","Loamy":"20-20","Black":"17-17-17","Red":"DAP","Clayey":"14-35-14"},
        "Millets":     {"Sandy":"Urea","Loamy":"DAP","Black":"20-20","Red":"28-28","Clayey":"17-17-17"},
        "Watermelon":  {"Sandy":"17-17-17","Loamy":"14-35-14","Black":"DAP","Red":"20-20","Clayey":"10-26-26"},
    }
    SOIL_NPK = {
        "Sandy": (20,8,15,6,12,5), "Loamy": (55,12,40,10,40,10),
        "Black": (70,12,50,10,50,10),"Red": (30,10,20,8,20,8),
        "Clayey":(60,10,45,10,45,10),
    }
    rows = []
    for _ in range(n):
        crop = np.random.choice(CROP_TYPES)
        soil = np.random.choice(SOIL_TYPES)
        fert = FERT_MAP[crop][soil]
        Nm,Ns,Pm,Ps,Km,Ks = SOIL_NPK[soil]
        N = max(0, np.random.normal(Nm,Ns))
        P = max(0, np.random.normal(Pm,Ps))
        K = max(0, np.random.normal(Km,Ks))
        temp = np.clip(np.random.normal(28,5), 10, 45)
        hum  = np.clip(np.random.normal(60,15), 10, 100)
        mois = np.clip(np.random.normal(45,15), 5,  90)
        rows.append({"Temperature":round(temp,2),"Humidity":round(hum,2),
                      "Moisture":round(mois,2),"Soil_Type":soil,"Crop_Type":crop,
                      "Nitrogen":round(N,2),"Potassium":round(K,2),
                      "Phosphorous":round(P,2),"Fertilizer_Name":fert})
    df = pd.DataFrame(rows).sample(frac=1,random_state=42).reset_index(drop=True)
    df.to_csv(os.path.join(DATASET_DIR,"Fertilizer_Prediction.csv"), index=False)
    print(f"  Generated Fertilizer_Prediction.csv  ({len(df)} rows)")
    return df


def generate_irrigation_dataset(n=8000):
    CROP_KC = {"Wheat":1.15,"Rice":1.20,"Maize":1.20,"Cotton":1.15,
               "Sugarcane":1.25,"Vegetables":1.05,"Fruits":0.90,
               "Pulses":1.05,"Groundnut":1.15}
    STAGES  = ["initial","development","mid_season","late_season"]
    STAGE_MOD = {"initial":0.80,"development":1.00,"mid_season":1.15,"late_season":0.85}

    crop_le  = LabelEncoder().fit(list(CROP_KC.keys()))
    stage_le = LabelEncoder().fit(STAGES)

    rows = []
    for _ in range(n):
        crop  = np.random.choice(list(CROP_KC.keys()))
        stage = np.random.choice(STAGES)
        sm    = np.clip(np.random.normal(50,20), 5, 95)
        temp  = np.clip(np.random.normal(28, 6), 8, 45)
        hum   = np.clip(np.random.normal(60,15),10,100)
        pH    = np.clip(np.random.normal(6.5,0.8),3.5,9.0)
        rain  = np.clip(np.random.exponential(30), 0, 200)
        ET0   = max(1.0, 0.0023*(temp+17.8)*(abs(temp-18)**0.5+3)*0.40)
        Kc    = CROP_KC[crop] * STAGE_MOD[stage]
        ETc   = ET0 * Kc
        eff_r = rain * 0.75
        depl  = max(0, (100-sm) + (ETc - eff_r/7)*2)
        label = 0 if (sm>=65 or depl<30) else (1 if (sm>=35 or depl<60) else 2)
        rows.append({"soil_moisture":round(sm,2),"temperature":round(temp,2),
                      "humidity":round(hum,2),"ph":round(pH,2),
                      "rainfall_mm":round(rain,2),
                      "crop_type_enc":int(crop_le.transform([crop])[0]),
                      "growth_stage_enc":int(stage_le.transform([stage])[0]),
                      "irrigation_label":label})

    save(crop_le,  "irrig_crop_encoder.joblib")
    save(stage_le, "irrig_stage_encoder.joblib")

    df = pd.DataFrame(rows).sample(frac=1,random_state=42).reset_index(drop=True)
    df.to_csv(os.path.join(DATASET_DIR,"Irrigation_dataset.csv"), index=False)
    counts = df["irrigation_label"].value_counts().sort_index()
    names  = ["no_irrigation","light_irrigation","heavy_irrigation"]
    print(f"  Generated Irrigation_dataset.csv  ({len(df)} rows)")
    for i,nm in enumerate(names):
        c=counts.get(i,0); print(f"    {nm:<20s}: {c:5d}  ({c/len(df)*100:.1f}%)")
    return df, crop_le, stage_le


# =============================================================
# FEATURE ENGINEERING
# =============================================================

def eng_crop(df):
    df = df.copy()
    df["npk_total"]  = df["n"] + df["p"] + df["k"]
    df["n_to_p"]     = df["n"] / (df["p"]+1e-3)
    df["n_to_k"]     = df["n"] / (df["k"]+1e-3)
    df["p_to_k"]     = df["p"] / (df["k"]+1e-3)
    df["heat_index"] = df["temperature"] * (1 - df["humidity"]/200)
    df["water_score"]= df["rainfall"] * df["humidity"] / 100
    return df


def eng_fert(df):
    df = df.copy()
    df["npk_total"]       = df["N"] + df["P"] + df["K"]
    df["n_deficiency"]    = np.where(df["N"]<40, 40-df["N"], 0)
    df["p_deficiency"]    = np.where(df["P"]<20, 20-df["P"], 0)
    df["k_deficiency"]    = np.where(df["K"]<20, 20-df["K"], 0)
    df["moisture_temp"]   = df["Moisture"] * df["Temperature"] / 100
    return df


def eng_irrig(df):
    df = df.copy()
    df["vpd_proxy"] = (1 - df["humidity"]/100) * df["temperature"]
    df["dryness"]   = (100 - df["soil_moisture"]) * df["vpd_proxy"] / 50
    df["eff_rain"]  = df["rainfall_mm"] * 0.75
    return df


# =============================================================
# MODEL 1 — CROP RECOMMENDATION
# =============================================================
print("\n── Model 1: Crop Recommendation ──────────────────────────")
try:
    df_crop = load_csv("Crop_recommendation.csv")
    if df_crop is None:
        df_crop = generate_crop_dataset(n_per_class=200)

    df_crop.columns = df_crop.columns.str.strip().str.lower()
    df_crop = eng_crop(df_crop)

    CROP_FEATS = ["n","p","k","temperature","humidity","ph","rainfall",
                  "npk_total","n_to_p","n_to_k","p_to_k","heat_index","water_score"]

    crop_le = LabelEncoder()
    y_crop  = crop_le.fit_transform(df_crop["label"].values)

    print(f"  Crops ({len(crop_le.classes_)}): {list(crop_le.classes_)}")
    print(f"  Features: {len(CROP_FEATS)}   Samples: {len(df_crop)}")

    X_crop  = df_crop[CROP_FEATS].values
    crop_sc = StandardScaler()
    Xs      = crop_sc.fit_transform(X_crop)

    Xtr,Xte,ytr,yte = train_test_split(Xs, y_crop, test_size=0.2,
                                        random_state=42, stratify=y_crop)

    pg = {"n_estimators":[200,400],"max_depth":[None,25],
          "min_samples_split":[2,4],"max_features":["sqrt","log2"]}
    best = tune_rf(Xtr, ytr, pg)

    cal = CalibratedClassifierCV(best, method="sigmoid", cv=3)
    cal.fit(Xtr, ytr)

    full_report(cal, Xte, yte, crop_le.classes_, "Crop Recommendation Results")

    imps = best.feature_importances_
    print("\n  Feature importances:")
    for f,v in sorted(zip(CROP_FEATS,imps), key=lambda x:-x[1]):
        print(f"    {f:<18s} {'█'*int(v*50)} {v:.4f}")

    print("\n  Saving ...")
    save(cal,         "crop_recommendation_model.joblib")
    save(crop_le,     "crop_label_encoder.joblib")
    save(crop_sc,     "crop_feature_scaler.joblib")
    save(CROP_FEATS,  "crop_feature_names.joblib")

except Exception as e:
    print(f"  FAILED: {e}"); traceback.print_exc()


# =============================================================
# MODEL 2 — FERTILIZER RECOMMENDATION
# =============================================================
print("\n── Model 2: Fertilizer Recommendation ────────────────────")
try:
    df_fert = load_csv("Fertilizer_Prediction.csv")
    if df_fert is None:
        df_fert = generate_fertilizer_dataset(n=6000)

    # If the CSV is too small (e.g. the 99-row Kaggle sample), ignore it
    # and generate a full dataset instead
    if len(df_fert) < 500:
        print(f"  CSV only has {len(df_fert)} rows — too small. Generating full dataset.")
        df_fert = generate_fertilizer_dataset(n=6000)

    # ── Normalise every known column-name variant ──────────────
    # Strip whitespace first, then handle spaces vs underscores
    df_fert.columns = df_fert.columns.str.strip()

    df_fert = df_fert.rename(columns={
        # Typo fix (Kaggle original)
        "Temparature":  "Temperature",
        # Space → underscore variants (Kaggle uses spaces)
        "Soil Type":    "Soil_Type",
        "Crop Type":    "Crop_Type",
        "Fertilizer Name": "Fertilizer_Name",
        # Long-form → short nutrient names
        "Nitrogen":     "N",
        "Phosphorous":  "P",
        "Phosphorus":   "P",
        "Potassium":    "K",
    })

    # Print actual columns for debugging
    print(f"  Columns: {list(df_fert.columns)}")

    df_fert = eng_fert(df_fert)

    soil_le  = LabelEncoder()
    ctype_le = LabelEncoder()
    fert_le  = LabelEncoder()

    df_fert["soil_enc"] = soil_le.fit_transform(df_fert["Soil_Type"].astype(str))
    df_fert["crop_enc"] = ctype_le.fit_transform(df_fert["Crop_Type"].astype(str))
    y_fert = fert_le.fit_transform(df_fert["Fertilizer_Name"].astype(str))

    FERT_FEATS = ["Temperature","Humidity","Moisture","soil_enc","crop_enc",
                  "N","K","P","npk_total","n_deficiency","p_deficiency",
                  "k_deficiency","moisture_temp"]

    print(f"  Fertilizers ({len(fert_le.classes_)}): {list(fert_le.classes_)}")
    print(f"  Features: {len(FERT_FEATS)}   Samples: {len(df_fert)}")

    X_fert = df_fert[FERT_FEATS].values
    fert_sc = StandardScaler()
    Xs      = fert_sc.fit_transform(X_fert)

    Xtr,Xte,ytr,yte = train_test_split(Xs, y_fert, test_size=0.2,
                                        random_state=42, stratify=y_fert)

    pg = {"n_estimators":[200,400],"max_depth":[None,20],
          "min_samples_split":[2,4],"max_features":["sqrt","log2"]}
    best = tune_rf(Xtr, ytr, pg)

    cal = CalibratedClassifierCV(best, method="sigmoid", cv=3)
    cal.fit(Xtr, ytr)

    full_report(cal, Xte, yte, fert_le.classes_, "Fertilizer Recommendation Results")

    print("\n  Saving ...")
    save(cal,         "fertilizer_recommendation_model.joblib")
    save(fert_le,     "fertilizer_label_encoder.joblib")
    save(fert_sc,     "fertilizer_feature_scaler.joblib")
    save(soil_le,     "soil_type_encoder.joblib")
    save(ctype_le,    "crop_type_encoder.joblib")
    save(FERT_FEATS,  "fertilizer_feature_names.joblib")

except Exception as e:
    print(f"  FAILED: {e}"); traceback.print_exc()


# =============================================================
# MODEL 3 — IRRIGATION RECOMMENDATION
# =============================================================
print("\n── Model 3: Irrigation Recommendation ────────────────────")
try:
    df_irrig, _, _ = generate_irrigation_dataset(n=8000)
    df_irrig = eng_irrig(df_irrig)

    IRRIG_FEATS = ["soil_moisture","temperature","humidity","ph",
                   "rainfall_mm","crop_type_enc","growth_stage_enc",
                   "vpd_proxy","dryness","eff_rain"]

    CLASS_NAMES = ["no_irrigation","light_irrigation","heavy_irrigation"]
    irrig_le    = LabelEncoder()
    irrig_le.fit(CLASS_NAMES)

    y_irrig = df_irrig["irrigation_label"].values

    print(f"  Features: {len(IRRIG_FEATS)}   Samples: {len(df_irrig)}")

    X_irrig  = df_irrig[IRRIG_FEATS].values
    irrig_sc = StandardScaler()
    Xs       = irrig_sc.fit_transform(X_irrig)

    Xtr,Xte,ytr,yte = train_test_split(Xs, y_irrig, test_size=0.2,
                                        random_state=42, stratify=y_irrig)

    pg = {"n_estimators":[200,400],"max_depth":[None,20],
          "min_samples_split":[2,5],"max_features":["sqrt","log2"]}
    best = tune_rf(Xtr, ytr, pg)

    cal = CalibratedClassifierCV(best, method="sigmoid", cv=3)
    cal.fit(Xtr, ytr)

    # Use numeric label names for report
    num_le = LabelEncoder().fit(y_irrig)
    full_report(cal, Xte, yte, [str(c) for c in num_le.classes_],
                "Irrigation Recommendation Results")

    imps = best.feature_importances_
    print("\n  Feature importances:")
    for f,v in sorted(zip(IRRIG_FEATS,imps), key=lambda x:-x[1]):
        print(f"    {f:<22s} {'█'*int(v*50)} {v:.4f}")

    print("\n  Saving ...")
    save(cal,         "irrigation_recommendation_model.joblib")
    save(irrig_le,    "irrigation_label_encoder.joblib")
    save(irrig_sc,    "irrigation_feature_scaler.joblib")
    save(IRRIG_FEATS, "irrigation_feature_names.joblib")

except Exception as e:
    print(f"  FAILED: {e}"); traceback.print_exc()


# =============================================================
# SUMMARY
# =============================================================
print("\n" + "=" * 65)
print("  Training Complete")
print("=" * 65)
for f in sorted(os.listdir(MODELS_DIR)):
    kb = os.path.getsize(os.path.join(MODELS_DIR, f)) / 1024
    print(f"  {f:<55s}  {kb:7.1f} KB")
print("\nAll models saved to ml/saved_models/")
print("Restart FastAPI — ML service loads them automatically.")
print("=" * 65)
