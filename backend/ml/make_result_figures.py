# =============================================================
# ml/make_result_figures.py
#
# Regenerates publication-quality result figures from the REAL
# trained artefacts in ml/saved_models/ and the REAL datasets.
#
#   Figure 8 : Crop Ensemble confusion matrix (18 Nepal crops)
#              -> reproduces the exact held-out test split
#                 (seed 42) and the saved model's predictions,
#                 then VERIFIES accuracy == saved report (95.15%).
#   Figure 9 : Comparative test accuracy across all 4 models.
#
# Run (from backend/ with venv):
#   .\venv\Scripts\python.exe ml\make_result_figures.py
# =============================================================

import os
import sys
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, ConfusionMatrixDisplay)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# Reproduce the EXACT RNG state used during training.
np.random.seed(42)

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")
MODELS_DIR  = os.path.join(BASE_DIR, "saved_models")
OUT_DIR     = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "figures"))
os.makedirs(OUT_DIR, exist_ok=True)

NEPAL_CROPS = [
    "rice", "wheat", "maize", "potato", "mustard", "soybean",
    "jute", "lentil", "chickpea", "blackgram", "mungbean",
    "pigeonpeas", "kidneybeans", "banana", "watermelon",
    "mango", "apple", "orange",
]

# Identical Nepal crop profiles used by train_models.py for the crops
# that are missing from the real Kaggle dataset.
_CROP_PROFILES = {
    "rice":        (80, 10, 45,  8, 45,  8, 28, 2, 82, 6, 6.5, 0.4, 210, 30),
    "wheat":       (70,  8, 40,  8, 40,  8, 18, 3, 60, 8, 6.3, 0.3,  80, 15),
    "maize":       (75, 10, 55, 10, 45, 10, 22, 3, 65, 8, 6.2, 0.4, 100, 20),
    "mustard":     (60, 10, 45,  8, 40,  8, 17, 3, 55, 8, 6.5, 0.4,  60, 15),
    "jute":        (78, 10, 46,  8, 40,  8, 28, 2, 80, 6, 6.5, 0.4, 175, 25),
    "lentil":      (18,  5, 68,  8, 19,  5, 16, 3, 64, 8, 6.9, 0.3,  45,  8),
    "chickpea":    (40,  8, 68, 10, 80, 12, 18, 3, 16, 5, 7.0, 0.4,  73, 15),
    "blackgram":   (40,  8, 68,  8, 19,  5, 30, 2, 65, 8, 7.0, 0.3,  67, 12),
    "mungbean":    (20,  5, 48,  8, 20,  5, 28, 2, 85, 8, 6.7, 0.4,  55, 12),
    "pigeonpeas":  (20,  5, 68,  8, 20,  5, 27, 2, 48, 8, 6.0, 0.4, 150, 25),
    "kidneybeans": (20,  5, 67, 10, 20,  5, 20, 3, 21, 5, 5.7, 0.4,  65, 15),
    "soybean":     (40,  8, 55,  8, 35,  8, 25, 2, 70, 8, 6.5, 0.4, 120, 20),
    "banana":      (100,10, 82, 10, 50, 10, 27, 2, 80, 6, 5.5, 0.4, 100, 20),
    "watermelon":  (99, 10, 17,  5, 50, 10, 27, 2, 85, 6, 6.5, 0.4,  50, 12),
    "potato":      (55,  8, 55,  8, 75, 10, 18, 3, 80, 6, 5.5, 0.4, 120, 20),
    "mango":       (20,  5, 27,  5, 30,  5, 31, 2, 50, 8, 5.7, 0.4,  94, 20),
    "apple":       (21,  5,134, 15,199, 20, 13, 3, 92, 6, 5.8, 0.4, 112, 20),
    "orange":      (20,  5, 10,  5, 10,  5, 20, 3, 92, 6, 6.5, 0.4, 110, 20),
}


def synth_crops(crops, n_per_class=200):
    """Exact copy of train_models.synth_crops (same RNG call order)."""
    rows = []
    for crop in crops:
        p = _CROP_PROFILES[crop]
        Nm,Ns,Pm,Ps,Km,Ks,Tm,Ts,Hm,Hs,pHm,pHs,Rm,Rs = p
        N  = np.clip(np.random.normal(Nm, Ns, n_per_class), 0, 200)
        P  = np.clip(np.random.normal(Pm, Ps, n_per_class), 0, 150)
        K  = np.clip(np.random.normal(Km, Ks, n_per_class), 0, 250)
        T  = np.clip(np.random.normal(Tm, Ts, n_per_class), 5,  45)
        H  = np.clip(np.random.normal(Hm, Hs, n_per_class), 10, 100)
        pH = np.clip(np.random.normal(pHm,pHs,n_per_class), 3.5, 9.0)
        R  = np.clip(np.random.normal(Rm, Rs, n_per_class), 0, 400)
        for i in range(n_per_class):
            rows.append({"n": round(N[i],2), "p": round(P[i],2), "k": round(K[i],2),
                         "temperature": round(T[i],2), "humidity": round(H[i],2),
                         "ph": round(pH[i],2), "rainfall": round(R[i],2), "label": crop})
    return pd.DataFrame(rows)


def reproduce_crop_test_set():
    """Rebuild the exact crop dataset + held-out test split used in training."""
    parts, real_nepal = [], []
    real_path = os.path.join(DATASET_DIR, "Crop_recommendation.csv")
    if os.path.exists(real_path):
        df_real = pd.read_csv(real_path)
        df_real.columns = df_real.columns.str.strip().str.lower()
        if "label" in df_real.columns:
            df_real["label"] = df_real["label"].str.lower()
            df_real = df_real[df_real["label"].isin(NEPAL_CROPS)]
            real_nepal = sorted(df_real["label"].unique().tolist())
            if len(df_real) > 0:
                parts.append(df_real[["n","p","k","temperature","humidity","ph","rainfall","label"]])
                print(f"  [REAL] Crop_recommendation.csv -> {len(real_nepal)} Nepal crops, {len(df_real)} rows")

    missing = [c for c in NEPAL_CROPS if c not in real_nepal]
    if missing:
        print(f"  [SYNTH] generating missing crops: {missing}")
        parts.append(synth_crops(missing, n_per_class=200))

    df_crop = pd.concat(parts, ignore_index=True) if parts else synth_crops(NEPAL_CROPS, 200)
    df_crop = df_crop.sample(frac=1, random_state=42).reset_index(drop=True)

    df_crop["npk_total"]   = df_crop["n"] + df_crop["p"] + df_crop["k"]
    df_crop["n_to_p"]      = df_crop["n"] / (df_crop["p"] + 1e-3)
    df_crop["n_to_k"]      = df_crop["n"] / (df_crop["k"] + 1e-3)
    df_crop["p_to_k"]      = df_crop["p"] / (df_crop["k"] + 1e-3)
    df_crop["heat_index"]  = df_crop["temperature"] * (1 - df_crop["humidity"] / 200)
    df_crop["water_score"] = df_crop["rainfall"] * df_crop["humidity"] / 100

    feat_names = joblib.load(os.path.join(MODELS_DIR, "crop_feature_names.joblib"))
    crop_le    = joblib.load(os.path.join(MODELS_DIR, "crop_encoder.joblib"))
    crop_sc    = joblib.load(os.path.join(MODELS_DIR, "crop_scaler.joblib"))

    y = crop_le.transform(df_crop["label"].values)
    X = df_crop[feat_names].values.astype(np.float32)
    Xs = crop_sc.transform(X)

    Xtr, Xte, ytr, yte = train_test_split(
        Xs, y, test_size=0.15, random_state=42, stratify=y)
    return Xte, yte, crop_le


def make_figure_8():
    print("\n=== Figure 8: Crop Ensemble Confusion Matrix ===")
    Xte, yte, crop_le = reproduce_crop_test_set()
    model = joblib.load(os.path.join(MODELS_DIR, "crop_ensemble_model.joblib"))
    y_pred = model.predict(Xte)

    acc = accuracy_score(yte, y_pred)
    print(f"  Reproduced test accuracy: {acc*100:.2f}%  (saved report: 95.15%)")
    print("  --- classification report (verification) ---")
    print(classification_report(yte, y_pred,
          target_names=[str(c) for c in crop_le.classes_], zero_division=0))

    if abs(acc * 100 - 95.15) > 0.30:
        print("  WARNING: accuracy deviates from saved report by >0.30 pts.")
        print("           The split may not match; inspect before using the figure.")
    else:
        print("  VERIFIED: reproduced split matches the saved report.")

    labels = [str(c) for c in crop_le.classes_]
    cm = confusion_matrix(yte, y_pred)
    fig, ax = plt.subplots(figsize=(11, 9))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=labels)
    disp.plot(ax=ax, cmap="Greens", colorbar=True, values_format="d")
    ax.set_title(f"Crop Ensemble (RF + XGBoost + LightGBM)\n"
                 f"Confusion Matrix — Test Accuracy {acc*100:.2f}%  (18 Nepal crops)",
                 fontsize=12, pad=14)
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", fontsize=9)
    plt.setp(ax.get_yticklabels(), fontsize=9)
    ax.set_xlabel("Predicted crop", fontsize=11)
    ax.set_ylabel("True crop", fontsize=11)
    fig.tight_layout()
    out = os.path.join(OUT_DIR, "figure-08-crop-confusion-matrix.png")
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"  saved -> {out}")


def make_figure_9():
    print("\n=== Figure 9: Comparative Test Accuracy ===")
    models = ["Crop Ensemble\n(RF+XGB+LGBM)", "Irrigation TTL\n(FT-Transformer)",
              "Soil Fertility\n(TabNet)", "Fertilizer\n(TabNet)"]
    acc    = [95.15, 97.67, 99.44, 97.43]
    colors = ["#16a34a", "#2563eb", "#9333ea", "#e11d48"]

    fig, ax = plt.subplots(figsize=(9, 5.5))
    bars = ax.bar(models, acc, color=colors, width=0.6, edgecolor="black", linewidth=0.6)
    for b, v in zip(bars, acc):
        ax.text(b.get_x() + b.get_width()/2, v + 0.15, f"{v:.2f}%",
                ha="center", va="bottom", fontsize=11, fontweight="bold")
    ax.set_ylim(90, 100.5)
    ax.set_ylabel("Test Accuracy (%)", fontsize=11)
    ax.set_title("Comparative Test Accuracy Across All Four ML Models", fontsize=13, pad=12)
    ax.axhline(90, color="gray", linewidth=0.8, linestyle="--", alpha=0.5)
    ax.grid(axis="y", alpha=0.3)
    ax.set_axisbelow(True)
    fig.tight_layout()
    out = os.path.join(OUT_DIR, "figure-09-comparative-accuracy.png")
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"  saved -> {out}")


if __name__ == "__main__":
    make_figure_8()
    make_figure_9()
    print("\nDone. Figures written to:", OUT_DIR)
