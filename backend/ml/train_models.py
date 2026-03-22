# =============================================================
# ml/train_models.py  —  Phase 8: Advanced Deep Learning Pipeline
#
# Models trained:
#   1. SwiFT (Sparse Weighted Fusion Transformer) — Crop Recommendation
#   2. TTL (FT-Transformer) — Irrigation Advice (5 classes, crop-aware)
#   3. TabNet Classifier — Soil Fertility (Low/Medium/High)
#   4. TabNet Classifier — Fertilizer Recommendation
#
# Usage (from backend/ with venv active):
#   python ml/train_models.py
#
# Optional Kaggle datasets (place in ml/datasets/ before running):
#   Crop_recommendation.csv   -> kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
#   Fertilizer_Prediction.csv -> kaggle.com/datasets/gdabhishek/fertilizer-prediction
#   Soil_Fertility.csv        -> kaggle.com/datasets/rahuljaiswalonkaggle/soil-fertility-dataset
# =============================================================

import os, sys, warnings, traceback
import numpy as np
import pandas as pd
import joblib
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from pytorch_tabnet.tab_model import TabNetClassifier

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.models.swift_crop import SwiFTCropModel
from ml.models.ttl_irrigation import TTLIrrigationModel, make_ttl_config

warnings.filterwarnings("ignore")
torch.manual_seed(42)
np.random.seed(42)

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")
MODELS_DIR  = os.path.join(BASE_DIR, "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)

DEVICE = torch.device("cpu")

print("=" * 65)
print("  AgriSense Phase 8 — Advanced DL Training Pipeline")
print(f"  Device: {DEVICE}  |  PyTorch: {torch.__version__}")
print("=" * 65)


# ──────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────

def save(obj, filename):
    path = os.path.join(MODELS_DIR, filename)
    joblib.dump(obj, path)
    print(f"    saved  {filename:<52s}  {os.path.getsize(path)/1024:7.1f} KB")


def save_torch(model, filename):
    path = os.path.join(MODELS_DIR, filename)
    torch.save(model.state_dict(), path)
    print(f"    saved  {filename:<52s}  {os.path.getsize(path)/1024:7.1f} KB")


def load_csv(filename):
    path = os.path.join(DATASET_DIR, filename)
    if not os.path.exists(path):
        return None
    df = pd.read_csv(path)
    print(f"  Loaded {filename}  ({len(df)} rows)")
    return df


def full_report(y_true, y_pred, class_names, title):
    acc = accuracy_score(y_true, y_pred)
    print(f"\n  {title}")
    print(f"    Test Accuracy : {acc*100:.2f}%")
    rep = classification_report(y_true, y_pred, target_names=[str(c) for c in class_names],
                                output_dict=True, zero_division=0)
    wa = rep["weighted avg"]
    print(f"    Precision (w) : {wa['precision']*100:.2f}%")
    print(f"    Recall    (w) : {wa['recall']*100:.2f}%")
    print(f"    F1-score  (w) : {wa['f1-score']*100:.2f}%")
    return acc


def train_pytorch_model(model, X_tr, y_tr, X_val, y_val,
                         epochs=50, lr=1e-3, batch_size=64,
                         x_cat_tr=None, x_cat_val=None, patience=10):
    """Generic PyTorch classification training loop with early stopping."""
    model.to(DEVICE)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, epochs)
    criterion = nn.CrossEntropyLoss()

    uses_cat = x_cat_tr is not None

    Xtr_t  = torch.tensor(X_tr,  dtype=torch.float32)
    ytr_t  = torch.tensor(y_tr,  dtype=torch.long)

    if uses_cat:
        cat_tr_t  = torch.tensor(x_cat_tr,  dtype=torch.long)
        cat_val_t = torch.tensor(x_cat_val, dtype=torch.long)
        train_ds  = TensorDataset(Xtr_t, cat_tr_t, ytr_t)
    else:
        train_ds = TensorDataset(Xtr_t, ytr_t)

    loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)

    Xval_t = torch.tensor(X_val, dtype=torch.float32).to(DEVICE)

    best_val_acc = 0.0
    best_state   = None
    no_improve   = 0

    for epoch in range(1, epochs + 1):
        model.train()
        for batch in loader:
            if uses_cat:
                xb, catb, yb = [t.to(DEVICE) for t in batch]
                logits = model(xb, catb)
            else:
                xb, yb = [t.to(DEVICE) for t in batch]
                logits = model(xb)
            loss = criterion(logits, yb)
            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
        scheduler.step()

        model.eval()
        with torch.no_grad():
            if uses_cat:
                val_logits = model(Xval_t, cat_val_t.to(DEVICE))
            else:
                val_logits = model(Xval_t)
            val_preds = val_logits.argmax(dim=1).cpu().numpy()
        val_acc = accuracy_score(y_val, val_preds)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state   = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            no_improve   = 0
        else:
            no_improve += 1

        if epoch % 10 == 0:
            print(f"    Epoch {epoch:3d}/{epochs}  val_acc={val_acc*100:.2f}%  "
                  f"best={best_val_acc*100:.2f}%")

        if no_improve >= patience:
            print(f"    Early stop at epoch {epoch}")
            break

    if best_state:
        model.load_state_dict(best_state)
    print(f"    Best validation accuracy: {best_val_acc*100:.2f}%")
    return best_val_acc


# ──────────────────────────────────────────────────────────────
# DATASET GENERATORS
# ──────────────────────────────────────────────────────────────

def generate_crop_dataset(n_per_class=200):
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
    }
    rows = []
    for crop, p in PROFILES.items():
        Nm,Ns,Pm,Ps,Km,Ks,Tm,Ts,Hm,Hs,pHm,pHs,Rm,Rs = p
        N  = np.clip(np.random.normal(Nm,Ns,n_per_class), 0, 200)
        P  = np.clip(np.random.normal(Pm,Ps,n_per_class), 0, 150)
        K  = np.clip(np.random.normal(Km,Ks,n_per_class), 0, 250)
        T  = np.clip(np.random.normal(Tm,Ts,n_per_class), 8,  45)
        H  = np.clip(np.random.normal(Hm,Hs,n_per_class),10, 100)
        pH = np.clip(np.random.normal(pHm,pHs,n_per_class),3.5, 9.0)
        R  = np.clip(np.random.normal(Rm,Rs,n_per_class),  0, 400)
        for i in range(n_per_class):
            rows.append({"N":round(N[i],2),"P":round(P[i],2),"K":round(K[i],2),
                         "temperature":round(T[i],2),"humidity":round(H[i],2),
                         "ph":round(pH[i],2),"rainfall":round(R[i],2),"label":crop})
    df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
    df.to_csv(os.path.join(DATASET_DIR, "Crop_recommendation.csv"), index=False)
    print(f"  Generated Crop_recommendation.csv  ({len(df)} rows, {len(PROFILES)} crops)")
    return df


def generate_soil_fertility_dataset(n=3000):
    rows = []
    for _ in range(n):
        N    = np.clip(np.random.normal(60, 30),  0, 200)
        P    = np.clip(np.random.normal(30, 20),  0, 100)
        K    = np.clip(np.random.normal(30, 20),  0, 100)
        pH   = np.clip(np.random.normal(6.5, 1.0), 3.5, 9.0)
        mois = np.clip(np.random.normal(50, 20),   5,  95)

        score  = 0
        score += 2 if N > 80  else (1 if N > 40 else 0)
        score += 2 if P > 40  else (1 if P > 15 else 0)
        score += 2 if K > 40  else (1 if K > 15 else 0)
        score += 2 if 6.0 <= pH <= 7.5 else (1 if 5.5 <= pH <= 8.0 else 0)
        score += 1 if 40 <= mois <= 70 else 0

        fertility = "High" if score >= 7 else ("Low" if score <= 2 else "Medium")

        rows.append({"N": round(N,2), "P": round(P,2), "K": round(K,2),
                     "pH": round(pH,2), "Moisture": round(mois,2),
                     "Fertility": fertility})

    df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
    df.to_csv(os.path.join(DATASET_DIR, "Soil_Fertility.csv"), index=False)
    counts = df["Fertility"].value_counts()
    print(f"  Generated Soil_Fertility.csv  ({len(df)} rows)")
    for cls, cnt in counts.items():
        print(f"    {cls:<8s}: {cnt:5d}  ({cnt/len(df)*100:.1f}%)")
    return df


def generate_irrigation_dataset(n=10000):
    CROP_KC = {"Wheat":1.15, "Rice":1.20, "Maize":1.20, "Cotton":1.15,
               "Sugarcane":1.25, "Vegetables":1.05, "Fruits":0.90,
               "Pulses":1.05, "Groundnut":1.15}
    STAGES    = ["initial", "development", "mid_season", "late_season"]
    STAGE_MOD = {"initial":0.80, "development":1.00, "mid_season":1.15, "late_season":0.85}

    crop_le  = LabelEncoder().fit(list(CROP_KC.keys()))
    stage_le = LabelEncoder().fit(STAGES)

    rows = []
    for _ in range(n):
        crop  = np.random.choice(list(CROP_KC.keys()))
        stage = np.random.choice(STAGES)
        sm    = np.clip(np.random.normal(50, 22),  5,  95)
        temp  = np.clip(np.random.normal(28,  6),  8,  45)
        hum   = np.clip(np.random.normal(60, 15), 10, 100)
        pH    = np.clip(np.random.normal(6.5,0.8), 3.5, 9.0)
        rain  = np.clip(np.random.exponential(30),  0, 200)

        ET0   = max(0.5, 0.0023 * (temp + 17.8) * (abs(temp - 18) ** 0.5 + 3) * 0.40)
        Kc    = CROP_KC[crop] * STAGE_MOD[stage]
        ETc   = ET0 * Kc
        eff_r = rain * 0.75
        depl  = max(0.0, (100 - sm) + (ETc - eff_r / 7) * 2.5)

        if   sm >= 65 and depl < 15:   label = 0
        elif sm >= 50 or depl < 30:    label = 1
        elif sm >= 35 or depl < 50:    label = 2
        elif sm >= 20 or depl < 70:    label = 3
        else:                          label = 4

        rows.append({
            "soil_moisture":    round(sm, 2),
            "temperature":      round(temp, 2),
            "humidity":         round(hum, 2),
            "ph":               round(pH, 2),
            "rainfall_mm":      round(rain, 2),
            "ET0":              round(ET0, 3),
            "ETc":              round(ETc, 3),
            "vpd_proxy":        round((1 - hum/100) * temp, 3),
            "depletion":        round(min(depl, 100), 2),
            "crop_type_enc":    int(crop_le.transform([crop])[0]),
            "growth_stage_enc": int(stage_le.transform([stage])[0]),
            "irrigation_label": label,
        })

    save(crop_le,  "ttl_irrig_crop_encoder.joblib")
    save(stage_le, "ttl_irrig_stage_encoder.joblib")

    df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
    df.to_csv(os.path.join(DATASET_DIR, "Irrigation_dataset.csv"), index=False)
    labels = ["No Irrig", "Irrig Recommended", "Highly Recommended", "Very Dry", "Immediate"]
    counts = df["irrigation_label"].value_counts().sort_index()
    print(f"  Generated Irrigation_dataset.csv  ({len(df)} rows, 5 classes)")
    for i, nm in enumerate(labels):
        c = counts.get(i, 0)
        print(f"    {i}: {nm:<22s} {c:5d}  ({c/len(df)*100:.1f}%)")
    return df, crop_le, stage_le


def generate_fertilizer_dataset(n=6000):
    SOIL_TYPES = ["Sandy","Loamy","Black","Red","Clayey"]
    CROP_TYPES = ["Wheat","Rice","Maize","Sugarcane","Cotton",
                  "Tobacco","Barley","Oil seeds","Paddy","Pulses",
                  "Ground Nuts","Millets","Watermelon"]
    FERT_MAP = {
        "Wheat":      {"Sandy":"Urea","Loamy":"DAP","Black":"17-17-17","Red":"28-28","Clayey":"14-35-14"},
        "Rice":       {"Sandy":"Urea","Loamy":"Urea","Black":"Urea","Red":"DAP","Clayey":"Urea"},
        "Maize":      {"Sandy":"DAP","Loamy":"20-20","Black":"17-17-17","Red":"DAP","Clayey":"28-28"},
        "Sugarcane":  {"Sandy":"10-26-26","Loamy":"17-17-17","Black":"Urea","Red":"20-20","Clayey":"14-35-14"},
        "Cotton":     {"Sandy":"14-35-14","Loamy":"14-35-14","Black":"DAP","Red":"28-28","Clayey":"17-17-17"},
        "Tobacco":    {"Sandy":"10-26-26","Loamy":"20-20","Black":"17-17-17","Red":"10-26-26","Clayey":"14-35-14"},
        "Barley":     {"Sandy":"Urea","Loamy":"DAP","Black":"17-17-17","Red":"20-20","Clayey":"28-28"},
        "Oil seeds":  {"Sandy":"20-20","Loamy":"10-26-26","Black":"17-17-17","Red":"DAP","Clayey":"14-35-14"},
        "Paddy":      {"Sandy":"Urea","Loamy":"Urea","Black":"Urea","Red":"DAP","Clayey":"Urea"},
        "Pulses":     {"Sandy":"DAP","Loamy":"20-20","Black":"17-17-17","Red":"10-26-26","Clayey":"14-35-14"},
        "Ground Nuts":{"Sandy":"10-26-26","Loamy":"20-20","Black":"17-17-17","Red":"DAP","Clayey":"14-35-14"},
        "Millets":    {"Sandy":"Urea","Loamy":"DAP","Black":"20-20","Red":"28-28","Clayey":"17-17-17"},
        "Watermelon": {"Sandy":"17-17-17","Loamy":"14-35-14","Black":"DAP","Red":"20-20","Clayey":"10-26-26"},
    }
    SOIL_NPK = {
        "Sandy":(20,8,15,6,12,5), "Loamy":(55,12,40,10,40,10),
        "Black":(70,12,50,10,50,10),"Red":(30,10,20,8,20,8), "Clayey":(60,10,45,10,45,10),
    }
    rows = []
    for _ in range(n):
        crop = np.random.choice(CROP_TYPES)
        soil = np.random.choice(SOIL_TYPES)
        fert = FERT_MAP[crop][soil]
        Nm,Ns,Pm,Ps,Km,Ks = SOIL_NPK[soil]
        N    = max(0, np.random.normal(Nm, Ns))
        P    = max(0, np.random.normal(Pm, Ps))
        K    = max(0, np.random.normal(Km, Ks))
        temp = np.clip(np.random.normal(28,5), 10, 45)
        hum  = np.clip(np.random.normal(60,15), 10, 100)
        mois = np.clip(np.random.normal(45,15), 5,  90)
        rows.append({"Temperature":round(temp,2),"Humidity":round(hum,2),
                     "Moisture":round(mois,2),"Soil_Type":soil,"Crop_Type":crop,
                     "Nitrogen":round(N,2),"Potassium":round(K,2),
                     "Phosphorous":round(P,2),"Fertilizer_Name":fert})
    df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
    df.to_csv(os.path.join(DATASET_DIR, "Fertilizer_Prediction.csv"), index=False)
    print(f"  Generated Fertilizer_Prediction.csv  ({len(df)} rows)")
    return df


# ──────────────────────────────────────────────────────────────
# MODEL 1 — SwiFT CROP RECOMMENDATION
# ──────────────────────────────────────────────────────────────
print("\n── Model 1: SwiFT Crop Recommendation ────────────────────")
try:
    df_crop = load_csv("Crop_recommendation.csv")
    if df_crop is None:
        df_crop = generate_crop_dataset(n_per_class=200)

    df_crop.columns = df_crop.columns.str.strip().str.lower()
    df_crop["npk_total"]   = df_crop["n"] + df_crop["p"] + df_crop["k"]
    df_crop["n_to_p"]      = df_crop["n"] / (df_crop["p"] + 1e-3)
    df_crop["n_to_k"]      = df_crop["n"] / (df_crop["k"] + 1e-3)
    df_crop["p_to_k"]      = df_crop["p"] / (df_crop["k"] + 1e-3)
    df_crop["heat_index"]  = df_crop["temperature"] * (1 - df_crop["humidity"] / 200)
    df_crop["water_score"] = df_crop["rainfall"] * df_crop["humidity"] / 100

    CROP_FEATS = ["n","p","k","temperature","humidity","ph","rainfall",
                  "npk_total","n_to_p","n_to_k","p_to_k","heat_index","water_score"]

    crop_le = LabelEncoder()
    y_crop  = crop_le.fit_transform(df_crop["label"].values)
    print(f"  Crops ({len(crop_le.classes_)}): {list(crop_le.classes_)}")
    print(f"  Features: {len(CROP_FEATS)}   Samples: {len(df_crop)}")

    X_crop  = df_crop[CROP_FEATS].values.astype(np.float32)
    crop_sc = StandardScaler()
    Xs      = crop_sc.fit_transform(X_crop)

    Xtr, Xte, ytr, yte = train_test_split(Xs, y_crop, test_size=0.2, random_state=42, stratify=y_crop)
    Xtr, Xval, ytr, yval = train_test_split(Xtr, ytr, test_size=0.15, random_state=42, stratify=ytr)

    swift_model = SwiFTCropModel(
        input_dim=len(CROP_FEATS), num_classes=len(crop_le.classes_),
        hidden_dim=64, num_heads=4, num_layers=2,
        sparsity_k=min(7, len(CROP_FEATS)), dropout=0.2,
    )
    train_pytorch_model(swift_model, Xtr, ytr, Xval, yval,
                        epochs=50, lr=1e-3, batch_size=64, patience=12)

    swift_model.eval()
    with torch.no_grad():
        logits = swift_model(torch.tensor(Xte, dtype=torch.float32))
    y_pred = logits.argmax(dim=1).numpy()
    full_report(yte, y_pred, crop_le.classes_, "SwiFT Crop Recommendation Results")

    print("\n  Saving SwiFT artefacts...")
    save_torch(swift_model, "swift_crop_model.pth")
    save({"input_dim": len(CROP_FEATS), "num_classes": len(crop_le.classes_),
          "hidden_dim": 64, "num_heads": 4, "num_layers": 2,
          "sparsity_k": min(7, len(CROP_FEATS)), "dropout": 0.2},
         "swift_crop_config.joblib")
    save(crop_le,    "swift_crop_encoder.joblib")
    save(crop_sc,    "swift_crop_scaler.joblib")
    save(CROP_FEATS, "swift_crop_feature_names.joblib")

except Exception as e:
    print(f"  FAILED: {e}"); traceback.print_exc()


# ──────────────────────────────────────────────────────────────
# MODEL 2 — TTL IRRIGATION ADVICE (5-class, crop-aware)
# ──────────────────────────────────────────────────────────────
print("\n── Model 2: TTL Irrigation Advice ─────────────────────────")
try:
    df_irrig, crop_le_irrig, stage_le_irrig = generate_irrigation_dataset(n=10000)

    NUM_FEATS  = ["soil_moisture","temperature","humidity","ph",
                  "rainfall_mm","ET0","ETc","vpd_proxy","depletion"]
    CAT_FEATS  = ["crop_type_enc", "growth_stage_enc"]
    NUM_CROPS  = len(crop_le_irrig.classes_)
    NUM_STAGES = len(stage_le_irrig.classes_)

    IRRIG_LABELS = [
        "Sufficient Moisture — No Irrigation Needed",
        "Moderate — Irrigation Recommended",
        "Moderate — Irrigation Highly Recommended",
        "Very Dry — Irrigation Needed",
        "Very Dry — Immediate Irrigation Needed",
    ]

    y_irrig = df_irrig["irrigation_label"].values
    X_num   = df_irrig[NUM_FEATS].values.astype(np.float32)
    X_cat   = df_irrig[CAT_FEATS].values.astype(np.int64)

    irrig_sc = StandardScaler()
    Xn_sc    = irrig_sc.fit_transform(X_num)

    Xn_tr, Xn_te, Xc_tr, Xc_te, y_tr, y_te = train_test_split(
        Xn_sc, X_cat, y_irrig, test_size=0.2, random_state=42, stratify=y_irrig)
    Xn_tr, Xn_val, Xc_tr, Xc_val, y_tr, y_val = train_test_split(
        Xn_tr, Xc_tr, y_tr, test_size=0.15, random_state=42, stratify=y_tr)

    print(f"  Features: {len(NUM_FEATS)} numerical + 2 categorical  |  Samples: {len(df_irrig)}")

    ttl_model = TTLIrrigationModel(
        num_numerical=len(NUM_FEATS), num_categorical=[NUM_CROPS, NUM_STAGES],
        num_classes=5, d_token=64, num_heads=4, num_layers=2,
    )
    train_pytorch_model(ttl_model, Xn_tr, y_tr, Xn_val, y_val,
                        epochs=60, lr=1e-3, batch_size=128, patience=15,
                        x_cat_tr=Xc_tr, x_cat_val=Xc_val)

    ttl_model.eval()
    with torch.no_grad():
        logits = ttl_model(
            torch.tensor(Xn_te, dtype=torch.float32),
            torch.tensor(Xc_te, dtype=torch.long)
        )
    y_pred = logits.argmax(dim=1).numpy()
    full_report(y_te, y_pred, IRRIG_LABELS, "TTL Irrigation Results")

    print("\n  Saving TTL artefacts...")
    save_torch(ttl_model, "ttl_irrigation_model.pth")
    cfg = make_ttl_config(len(NUM_FEATS), [NUM_CROPS, NUM_STAGES], 5, 64, 4, 2)
    save(cfg,          "ttl_irrigation_config.joblib")
    save(irrig_sc,     "ttl_irrigation_scaler.joblib")
    save(IRRIG_LABELS, "ttl_irrigation_labels.joblib")
    save(NUM_FEATS,    "ttl_irrigation_num_features.joblib")

except Exception as e:
    print(f"  FAILED: {e}"); traceback.print_exc()


# ──────────────────────────────────────────────────────────────
# MODEL 3 — TABNET SOIL FERTILITY
# ──────────────────────────────────────────────────────────────
print("\n── Model 3: TabNet Soil Fertility ─────────────────────────")
try:
    df_soil = load_csv("Soil_Fertility.csv")
    if df_soil is None:
        df_soil = generate_soil_fertility_dataset(n=3000)

    df_soil.columns = df_soil.columns.str.strip()
    rename_map = {
        "Output":"Fertility","fertility":"Fertility","Nitrogen":"N","Phosphorus":"P",
        "Phosphorous":"P","Potassium":"K","ph":"pH","moisture":"Moisture","moisture(%)":"Moisture",
    }
    df_soil = df_soil.rename(columns={c: rename_map.get(c, c) for c in df_soil.columns})

    SOIL_FEATS = ["N", "P", "K", "pH", "Moisture"]
    for f in SOIL_FEATS:
        if f not in df_soil.columns:
            df_soil[f] = 50.0

    fertility_le = LabelEncoder()
    y_soil = fertility_le.fit_transform(df_soil["Fertility"].astype(str).values)
    print(f"  Classes: {list(fertility_le.classes_)}  |  Samples: {len(df_soil)}")

    X_soil  = df_soil[SOIL_FEATS].values.astype(np.float32)
    soil_sc = StandardScaler()
    Xs      = soil_sc.fit_transform(X_soil)

    Xtr, Xte, ytr, yte = train_test_split(Xs, y_soil, test_size=0.2, random_state=42, stratify=y_soil)
    Xtr, Xval, ytr, yval = train_test_split(Xtr, ytr, test_size=0.15, random_state=42, stratify=ytr)

    tabnet_soil = TabNetClassifier(
        n_d=32, n_a=32, n_steps=4, gamma=1.5, lambda_sparse=1e-3,
        optimizer_fn=torch.optim.Adam,
        optimizer_params={"lr": 2e-3},
        scheduler_fn=torch.optim.lr_scheduler.StepLR,
        scheduler_params={"step_size": 10, "gamma": 0.9},
        verbose=0, seed=42
    )
    tabnet_soil.fit(
        Xtr, ytr, eval_set=[(Xval, yval)], eval_metric=["accuracy"],
        max_epochs=100, patience=15, batch_size=256, virtual_batch_size=64,
    )

    y_pred = tabnet_soil.predict(Xte)
    full_report(yte, y_pred, fertility_le.classes_, "TabNet Soil Fertility Results")

    print("\n  Saving TabNet Soil artefacts...")
    soil_path = os.path.join(MODELS_DIR, "tabnet_soil_model")
    tabnet_soil.save_model(soil_path)
    print(f"    saved  tabnet_soil_model.zip")
    save(fertility_le, "soil_fertility_encoder.joblib")
    save(soil_sc,      "soil_feature_scaler.joblib")
    save(SOIL_FEATS,   "soil_feature_names.joblib")

    # Save a small background sample for LIME explanations at inference time
    save(Xtr[:200], "soil_lime_background.joblib")

except Exception as e:
    print(f"  FAILED: {e}"); traceback.print_exc()


# ──────────────────────────────────────────────────────────────
# MODEL 4 — TABNET FERTILIZER RECOMMENDATION
# ──────────────────────────────────────────────────────────────
print("\n── Model 4: TabNet Fertilizer Recommendation ──────────────")
try:
    df_fert = load_csv("Fertilizer_Prediction.csv")
    if df_fert is None:
        df_fert = generate_fertilizer_dataset(n=6000)
    if len(df_fert) < 500:
        df_fert = generate_fertilizer_dataset(n=6000)

    df_fert.columns = df_fert.columns.str.strip()
    df_fert = df_fert.rename(columns={
        "Temparature":"Temperature","Soil Type":"Soil_Type","Crop Type":"Crop_Type",
        "Fertilizer Name":"Fertilizer_Name","Nitrogen":"Nitrogen",
        "Phosphorous":"Phosphorous","Phosphorus":"Phosphorous","Potassium":"Potassium",
    })

    fert_soil_le = LabelEncoder()
    fert_crop_le = LabelEncoder()
    fert_le      = LabelEncoder()

    df_fert["soil_enc"] = fert_soil_le.fit_transform(df_fert["Soil_Type"].astype(str))
    df_fert["crop_enc"] = fert_crop_le.fit_transform(df_fert["Crop_Type"].astype(str))
    y_fert = fert_le.fit_transform(df_fert["Fertilizer_Name"].astype(str))

    FERT_FEATS = ["Temperature","Humidity","Moisture","soil_enc","crop_enc",
                  "Nitrogen","Potassium","Phosphorous"]

    print(f"  Fertilizers ({len(fert_le.classes_)}): {list(fert_le.classes_)}")
    print(f"  Features: {len(FERT_FEATS)}   Samples: {len(df_fert)}")

    X_fert  = df_fert[FERT_FEATS].values.astype(np.float32)
    fert_sc = StandardScaler()
    Xs      = fert_sc.fit_transform(X_fert)

    Xtr, Xte, ytr, yte = train_test_split(Xs, y_fert, test_size=0.2, random_state=42, stratify=y_fert)
    Xtr, Xval, ytr, yval = train_test_split(Xtr, ytr, test_size=0.15, random_state=42, stratify=ytr)

    tabnet_fert = TabNetClassifier(
        n_d=32, n_a=32, n_steps=4, gamma=1.5, lambda_sparse=1e-3,
        optimizer_fn=torch.optim.Adam,
        optimizer_params={"lr": 2e-3},
        verbose=0, seed=42
    )
    tabnet_fert.fit(
        Xtr, ytr, eval_set=[(Xval, yval)], eval_metric=["accuracy"],
        max_epochs=100, patience=15, batch_size=256, virtual_batch_size=64,
    )

    y_pred = tabnet_fert.predict(Xte)
    full_report(yte, y_pred, fert_le.classes_, "TabNet Fertilizer Results")

    print("\n  Saving TabNet Fertilizer artefacts...")
    fert_path = os.path.join(MODELS_DIR, "tabnet_fert_model")
    tabnet_fert.save_model(fert_path)
    print(f"    saved  tabnet_fert_model.zip")
    save(fert_le,      "fert_label_encoder.joblib")
    save(fert_sc,      "fert_feature_scaler.joblib")
    save(fert_soil_le, "fert_soil_type_encoder.joblib")
    save(fert_crop_le, "fert_crop_type_encoder.joblib")
    save(FERT_FEATS,   "fert_feature_names.joblib")

    # Save background sample for LIME
    save(Xtr[:200], "fert_lime_background.joblib")

except Exception as e:
    print(f"  FAILED: {e}"); traceback.print_exc()


# ──────────────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────────────
print("\n" + "=" * 65)
print("  Phase 8 Training Complete")
print("=" * 65)
for f in sorted(os.listdir(MODELS_DIR)):
    kb = os.path.getsize(os.path.join(MODELS_DIR, f)) / 1024
    print(f"  {f:<55s}  {kb:7.1f} KB")
print("\nAll models saved. Restart FastAPI to load new models.")
print("=" * 65)
