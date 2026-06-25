# Machine Learning Models — Design, Training, Evaluation and Integration

**Companion technical chapter to `PROJECT_REPORT.md`**

This document is a self-contained, research-oriented account of every machine
learning model in the *IoT-Enabled Smart Agriculture Monitoring and Decision
Support System*. It describes how each model was selected, trained, evaluated,
and integrated into the running system, and it records the central algorithmic
decision of the project — the replacement of a deep-learning transformer for crop
recommendation with a tree-based ensemble — together with the evidence and
reasoning behind it.

It is written so that it can stand alone as a reference or be folded into the
main report (primarily Chapters 4, 5 and 6, and the Literature Review).

---

## Table of Contents

1. Role of Machine Learning in the System
2. Overview of the Four Models
3. Datasets, Feature Engineering and Class Balancing
4. The Crop-Model Algorithm Decision (SwiFT Transformer → Tree Ensemble)
5. Irrigation Model — TTL / FT-Transformer (Design Rationale)
6. Soil Fertility and Fertilizer Models — TabNet + LIME (Design Rationale)
7. Training Methodology
8. Evaluation and Test Results
9. Inference and System Integration (End-to-End Working Flow)
10. Pros, Cons and Limitations
11. Deep Learning vs. Tree-Based Models for Tabular Data — Discussion
12. References

---

## 1. Role of Machine Learning in the System

The IoT layer of the system answers the question *"what is the current state of
the field?"* — temperature, humidity, soil moisture and pH. The machine learning
layer answers the more valuable question *"what should the farmer do about it?"*.
Four independent models translate raw sensor and weather readings into four
distinct, actionable recommendations:

1. **Crop recommendation** — which crop is most suitable for the current soil and
   climate.
2. **Irrigation advice** — whether (and how urgently) the field needs watering.
3. **Soil fertility classification** — whether the soil is of Low, Medium or High
   fertility.
4. **Fertilizer recommendation** — which fertilizer best addresses the soil's
   nutrient profile.

The models are trained offline in a reproducible pipeline (`ml/train_models.py`)
and served at runtime by a single inference engine (`app/services/ml_service.py`)
that the FastAPI backend exposes through REST endpoints. Two of the four models
(soil and fertilizer) additionally provide LIME-based explanations so that a
recommendation can be justified to the farmer in terms of the soil parameters
that drove it.

---

## 2. Overview of the Four Models

**Table 1 — Model summary**

| # | Task | Algorithm | Type | Classes | Dataset (test) | Test Accuracy | Explainable |
|---|------|-----------|------|---------|----------------|---------------|-------------|
| 1 | Crop recommendation | Random Forest + XGBoost + LightGBM (soft voting) | Tree ensemble | 18 | 2,200 (330) | **95.15%** | feature importance |
| 2 | Irrigation advice | TTL (FT-Transformer) | Deep learning | 5 | 12,000 (1,800) | **97.67%** | attention |
| 3 | Soil fertility | TabNet | Deep learning | 3 | 6,000 (900) | **99.44%** | LIME + attention |
| 4 | Fertilizer recommendation | TabNet | Deep learning | 5 | 10,099 (1,515) | **97.43%** | LIME + attention |

Only the **crop model's algorithm was changed** during development (Section 4).
The other three were chosen at design time and retained; their rationale is
documented in Sections 5 and 6 as design decisions rather than changes.

---

## 3. Datasets, Feature Engineering and Class Balancing

### 3.1 Datasets

**Table 2 — Datasets used (15% stratified hold-out test split)**

| Model | Total samples | Composition | Classes |
|---|---|---|---|
| Crop | 2,200 | 1,400 real (Kaggle Crop Recommendation, 14 crops × 100) + 800 synthetic (4 Nepal crops × 200) | 18 |
| Irrigation | 12,000 | Hybrid: real feature distributions sampled from TARP.csv + FAO-56 rule-based labels | 5 |
| Soil fertility | 6,000 | Synthetic, generated from NARC agronomic thresholds | 3 |
| Fertilizer | 10,099 | 10,000 synthetic (feature ranges seeded from real data) + 99 real (Kaggle Fertilizer Prediction) | 5 |

The 18 crops are the Terai and mid-hill crops relevant to Nepal: rice, wheat,
maize, potato, mustard, soybean, jute, lentil, chickpea, blackgram, mungbean,
pigeonpeas, kidneybeans, banana, watermelon, mango, apple and orange. The five
fertilizers are those available in Nepal: Urea, DAP, MOP, NPK 20-20-20 and
Compost.

### 3.2 Feature Engineering

The crop model uses **thirteen features**: the seven base measurements (N, P, K,
temperature, humidity, pH, rainfall) plus six engineered features that encode
agronomically meaningful relationships:

| Engineered feature | Definition | Intuition |
|---|---|---|
| `npk_total` | N + P + K | overall nutrient availability |
| `n_to_p` | N / (P + ε) | nitrogen–phosphorus balance |
| `n_to_k` | N / (K + ε) | nitrogen–potassium balance |
| `p_to_k` | P / (K + ε) | phosphorus–potassium balance |
| `heat_index` | T × (1 − H/200) | combined heat-and-humidity stress |
| `water_score` | rainfall × H / 100 | effective water availability |

The irrigation model uses **nine numerical + two categorical** features. Beyond
the raw soil moisture, temperature, humidity, pH and rainfall, it computes
agronomic quantities from the FAO-56 framework: reference evapotranspiration
(ET₀, via a simplified Hargreaves equation), crop evapotranspiration
(ETc = ET₀ × Kc × stage-modifier), a vapour-pressure-deficit proxy, and a
soil-water depletion estimate. The two categorical features are crop type and
growth stage.

The soil model uses five features (N, P, K, pH, moisture); the fertilizer model
uses eight (temperature, humidity, moisture, soil type, crop type, N, P, K). All
numerical features are standardised with a fitted `StandardScaler`, and
categorical inputs are label-encoded.

### 3.3 Class Balancing (SMOTE)

Agricultural class distributions are uneven (e.g., far more "Medium" fertility
samples than "Low"). To prevent the models from simply predicting the majority
class, the **Synthetic Minority Over-sampling Technique (SMOTE)** is applied to
the **training fold only** — never to the test set — whenever the imbalance ratio
exceeds 1.5×. SMOTE synthesises new minority-class examples by interpolating
between existing ones, giving the learner a balanced view while keeping
evaluation honest on the untouched, naturally distributed test set.

---

## 4. The Crop-Model Algorithm Decision (SwiFT Transformer → Tree Ensemble)

This section documents the single most important algorithmic decision of the
project. It is the only model whose **algorithm was changed** during development.

### 4.1 The initial approach: SwiFT (a sparse-attention transformer)

Crop recommendation was first implemented with **SwiFT**, a custom
sparse-attention Transformer that treats each input feature as a token, applies
top-k sparse multi-head self-attention to model feature interactions, and pools
the result through a learnable weighted-fusion gate before a classification head.
Transformers are powerful sequence/relationship learners and were chosen with the
expectation that they would capture complex non-linear interactions between soil
nutrients and climate.

**The problem observed.** On the project's dataset — roughly 2,200 records across
18 classes, i.e. only a few hundred examples per crop — the transformer
underperformed badly. Its best recorded test accuracy was **73.64%**, and earlier
training runs scored as low as **≈63%**. The model never approached the project's
target of 90%+ accuracy. The cause is well understood and is not a coding defect:
Transformers have a very large number of trainable parameters and require large
training corpora (typically tens of thousands of examples per class) to
generalise. With a small tabular dataset, the model overfits — it memorises
training noise instead of learning stable decision boundaries — which manifests
as a gap between training and test performance and erratic per-class results.

### 4.2 The replacement: a Random Forest + XGBoost + LightGBM ensemble

The crop model was replaced with a **soft-voting ensemble of three tree-based
classifiers**. Tree-based models are the consistently dominant family for
small-to-medium tabular data, and combining three of them through soft voting
(averaging their predicted class probabilities) reduces variance further and
yields a well-calibrated confidence score and a reliable top-3 ranking.

- **Random Forest** — a bagging ensemble of decision trees; low variance, robust
  to noise, strong default behaviour on tabular data.
- **XGBoost (Extreme Gradient Boosting)** — a regularised gradient-boosting
  method; typically the highest single-model accuracy on structured data.
- **LightGBM (Light Gradient Boosting Machine)** — a histogram-based, leaf-wise
  boosting method; fast and accurate, with a slightly different inductive bias
  from XGBoost, which improves ensemble diversity.

**Soft voting** combines them: the final class probability is the average of the
three models' probabilities, and the predicted crop is the arg-max. Diversity
between a bagging learner (RF) and two boosting learners (XGBoost, LightGBM) means
their errors are partially uncorrelated, so the average is more accurate and more
stable than any single member.

**Result.** On the identical feature set and data, the ensemble achieves
**95.15% test accuracy** and **97.78% mean accuracy under five-fold stratified
cross-validation** — an improvement of more than twenty percentage points over
the transformer, comfortably crossing the 90%+ target.

### 4.3 Head-to-head comparison

**Table 3 — SwiFT transformer vs. tree ensemble (crop recommendation)**

| Criterion | SwiFT (Transformer) | RF + XGBoost + LightGBM (Ensemble) |
|---|---|---|
| Test accuracy | 73.64% (≈63% on earlier runs) | **95.15%** |
| Cross-validation | not stable across runs | **97.78% (5-fold)** |
| Data efficiency | poor — needs large datasets | **excellent on small tabular data** |
| Overfitting risk (≈2k rows) | high | low |
| Training time (CPU) | minutes (epoch-based, GPU-preferred) | **seconds–minutes, CPU-friendly** |
| Inference latency | low | **very low** |
| Interpretability | attention weights (indirect) | **native feature importance** |
| Hyper-parameter sensitivity | high | moderate |
| Implementation complexity | high (custom PyTorch) | **low (scikit-learn API)** |
| Serialisation | PyTorch state-dict + config | **single joblib artefact** |

### 4.4 Why the ensemble was chosen

The decision was evidence-driven:

1. **Accuracy on the available data.** The ensemble met the accuracy requirement;
   the transformer did not, by a wide margin.
2. **Right tool for the data regime.** Published evidence and our own results show
   tree ensembles outperform deep networks on typical tabular datasets of this
   size (Section 11).
3. **Robustness and reproducibility.** Cross-validated performance was high and
   stable, whereas the transformer's accuracy swung between runs.
4. **Operational simplicity.** The ensemble trains in seconds on CPU, serialises
   to a single file, and removes a heavyweight deep-learning dependency from the
   crop path.
5. **Built-in interpretability.** Tree models expose feature importance directly,
   supporting the project's explainability goal without extra machinery.

The transformer was therefore fully retired from the crop path. This is presented
in the report not as a failure but as sound engineering judgement: an
architecture was trialled, objectively measured against a requirement, found
unsuitable for the data regime, and replaced with a better-matched method whose
superiority was then validated by cross-validation.

### 4.5 Ensemble configuration

| Member | Key hyper-parameters |
|---|---|
| Random Forest | 400 trees, `max_features="sqrt"`, `class_weight="balanced"` |
| XGBoost | 500 estimators, `max_depth=6`, `learning_rate=0.05`, `subsample=0.9`, `colsample_bytree=0.9`, `reg_lambda=1.0`, `tree_method="hist"` |
| LightGBM | 500 estimators, `num_leaves=31`, `learning_rate=0.05`, `subsample=0.9`, `colsample_bytree=0.9`, `reg_lambda=1.0`, `class_weight="balanced"` |
| Combiner | scikit-learn `VotingClassifier`, `voting="soft"`, equal weights |

---

## 5. Irrigation Model — TTL / FT-Transformer (Design Rationale)

The irrigation model was **not changed**; the rationale below is a design
decision, recorded for completeness.

Irrigation advice is provided by a **TTL (Tabular Transfer Learning) model based
on the FT-Transformer architecture**, which tokenises both numerical and
categorical features and processes them with multi-head self-attention and a
classification (CLS) token. A transformer is appropriate here — unlike for the
crop model — for two reasons:

1. **Data volume.** The irrigation dataset contains 12,000 samples, an order of
   magnitude larger than the crop dataset, which is sufficient for a transformer
   to train without severe overfitting.
2. **Mixed feature types and crop-awareness.** Irrigation need depends jointly on
   continuous agronomic quantities (evapotranspiration, depletion) and on
   categorical context (crop type, growth stage). The FT-Transformer's feature
   tokeniser embeds categorical variables as learnable tokens, allowing the model
   to represent, for example, that rice at mid-season has a higher water demand
   than mustard at the initial stage.

The model classifies into five urgency levels (from "Sufficient Moisture — No
Irrigation Needed" to "Very Dry — Immediate Irrigation Needed") and is
**crop-aware**: the confirmed crop drives both a learned categorical embedding and
the FAO-56 crop coefficient (Kc) used in the evapotranspiration computation.
Configuration: token dimension 64, 4 attention heads, 2 transformer layers.

---

## 6. Soil Fertility and Fertilizer Models — TabNet + LIME (Design Rationale)

These models were **not changed**; the rationale below is a design decision.

Both soil fertility classification and fertilizer recommendation use **TabNet**, a
deep learning architecture purpose-built for tabular data. TabNet was selected for
one decisive property: **built-in interpretability**. Through sequential
attention, it learns sparse feature masks that indicate which inputs it used at
each decision step. This aligns with the project's goal of explaining
recommendations to farmers rather than presenting opaque outputs.

TabNet is complemented by **LIME (Local Interpretable Model-agnostic
Explanations)**. For any individual prediction, LIME perturbs the input around the
instance, observes how the model's output changes, and fits a simple local
surrogate to report which feature conditions most influenced that specific
recommendation (for example, "Nitrogen < 40" pushing towards a Urea
recommendation). The system stores a 200-sample background set at training time
and, when an explanation is requested, returns the top contributing features.

- **Soil fertility:** 3 classes (Low / Medium / High) from 5 features.
- **Fertilizer:** 5 Nepal fertilizers from 8 features, plus an auxiliary NPK
  status assessment (low / optimal / high per nutrient).

TabNet configuration (both models): decision/attention width 32, 5 decision
steps, sparsity regularisation 1e-3, Adam optimiser.

> **Why TabNet here but not for crop?** The soil and fertilizer datasets are
> larger (6,000 and 10,099 samples) and their decision boundaries are closely
> tied to a few threshold features, which TabNet's sparse attention captures well;
> they also benefit most from per-prediction explanations. The crop task, with far
> fewer samples per class, fell squarely in the regime where tree ensembles
> dominate — hence the different choice.

---

## 7. Training Methodology

All models are trained by a single reproducible script, `ml/train_models.py`,
with fixed random seeds (`numpy`, `torch`, and per-estimator `random_state=42`).
The unified pipeline guarantees that every artefact in `ml/saved_models/` can be
regenerated from scratch with one command.

**Common steps**

1. Load real datasets where available; generate Nepal-specific synthetic data
   only where real data is insufficient (written to `ml/datasets/generated/` so it
   never masquerades as real data).
2. Engineer features and standardise numerical inputs with `StandardScaler`.
3. Label-encode targets and categorical inputs.
4. Stratified 85/15 train/test split.
5. Apply SMOTE to the training fold when imbalance > 1.5×.
6. Train, evaluate on the untouched test set, and persist the model plus its
   encoders, scaler and feature list.

**Per-model training configuration**

| Model | Validation strategy | Key settings |
|---|---|---|
| Crop ensemble | 5-fold stratified cross-validation on the (SMOTE-balanced) training set | RF/XGBoost/LightGBM as in Table; soft voting |
| Irrigation (TTL) | hold-out validation, early stopping (patience 15) | 60 epochs max, lr 1e-3, batch 128, Adam, cosine schedule, gradient clipping |
| Soil (TabNet) | hold-out validation, early stopping (patience 20) | 150 epochs max, lr 2e-3, batch 256, virtual batch 64 |
| Fertilizer (TabNet) | hold-out validation, early stopping (patience 20) | 150 epochs max, lr 2e-3, batch 256, virtual batch 64 |

The crop ensemble's use of **cross-validation** (rather than a single validation
split) is deliberate: with a small dataset, a single split gives a noisy estimate,
whereas 5-fold CV averages over five partitions for a far more trustworthy
accuracy figure (97.78%).

---

## 8. Evaluation and Test Results

All metrics below are computed on the held-out test sets (never seen during
training, and not subjected to SMOTE), using precision, recall and F1-score per
class plus overall accuracy. The full classification reports are reproduced from
the training run for transparency and reproducibility.

### 8.1 Crop Recommendation (Ensemble) — 95.15%

```
Crop Ensemble Recommendation Results
Accuracy: 95.15%

              precision    recall  f1-score   support
       apple       1.00      1.00      1.00        15
      banana       1.00      1.00      1.00        15
   blackgram       1.00      1.00      1.00        15
    chickpea       1.00      1.00      1.00        15
        jute       0.79      1.00      0.88        15
 kidneybeans       1.00      1.00      1.00        15
      lentil       1.00      1.00      1.00        15
       maize       1.00      1.00      1.00        15
       mango       1.00      1.00      1.00        15
    mungbean       1.00      1.00      1.00        15
     mustard       0.88      0.70      0.78        30
      orange       1.00      1.00      1.00        15
  pigeonpeas       1.00      1.00      1.00        15
      potato       1.00      1.00      1.00        30
        rice       1.00      0.73      0.85        15
     soybean       1.00      1.00      1.00        30
  watermelon       1.00      1.00      1.00        15
       wheat       0.75      0.90      0.82        30

    accuracy                          0.95       330
   macro avg       0.97      0.96      0.96       330
weighted avg       0.96      0.95      0.95       330
```

Most crops are classified perfectly. The residual confusion concentrates among
crops with overlapping nutrient/climate profiles — notably mustard, rice, wheat
and jute — which is agronomically reasonable. 5-fold cross-validation accuracy on
the training data was 97.78%, confirming the result is not an artefact of a lucky
split.

### 8.2 Irrigation Advice (TTL) — 97.67%

```
TTL Irrigation Results
Accuracy: 97.67%

                                            precision  recall  f1   support
Sufficient Moisture — No Irrigation Needed       1.00    0.98  0.99     441
         Moderate — Irrigation Recommended       0.99    0.98  0.98     542
  Moderate — Irrigation Highly Recommended       0.96    1.00  0.98     372
              Very Dry — Irrigation Needed       0.99    0.93  0.96     306
    Very Dry — Immediate Irrigation Needed       0.90    0.99  0.94     139

                                  accuracy                  0.98    1800
                                 macro avg       0.97  0.98  0.97    1800
                              weighted avg       0.98  0.98  0.98    1800
```

### 8.3 Soil Fertility (TabNet) — 99.44%

```
TabNet Soil Fertility Results
Accuracy: 99.44%

              precision    recall  f1-score   support
        High       1.00      0.99      1.00       269
         Low       0.99      1.00      0.99       270
      Medium       0.99      0.99      0.99       361

    accuracy                          0.99       900
   macro avg       0.99      0.99      0.99       900
weighted avg       0.99      0.99      0.99       900
```

### 8.4 Fertilizer Recommendation (TabNet) — 97.43%

```
TabNet Fertilizer Results
Accuracy: 97.43%

              precision    recall  f1-score   support
     Compost       1.00      0.99      0.99      1079
         DAP       0.69      1.00      0.82        20
         MOP       0.84      0.95      0.89        79
NPK 20-20-20       0.99      0.93      0.96       227
        Urea       0.90      0.95      0.92       110

    accuracy                          0.97      1515
   macro avg       0.88      0.96      0.92      1515
weighted avg       0.98      0.97      0.98      1515
```

The lower macro-average for fertilizer reflects the small support of the DAP and
MOP classes; weighted metrics remain high (0.98). This is the expected behaviour
of a naturally imbalanced target and is reported honestly rather than masked.

### 8.5 Comparative summary

**Table 4 — All models, test-set performance**

| Model | Algorithm | Classes | Test Accuracy | Weighted F1 |
|---|---|---|---|---|
| Crop | RF + XGBoost + LightGBM | 18 | 95.15% | 0.95 |
| Irrigation | TTL (FT-Transformer) | 5 | 97.67% | 0.98 |
| Soil fertility | TabNet | 3 | 99.44% | 0.99 |
| Fertilizer | TabNet | 5 | 97.43% | 0.98 |

For context, the crop model's predecessor (SwiFT transformer) achieved only
73.64% on the same task — the single largest quality improvement delivered during
development.

---

## 9. Inference and System Integration (End-to-End Working Flow)

### 9.1 How the models are loaded

At FastAPI startup, `ml_service.load_all_models()` loads all four models into
memory once: the crop ensemble and its scaler/encoder from a joblib artefact, the
TTL model from a saved configuration plus PyTorch weights, and the two TabNet
models from their saved archives with their scalers, encoders and LIME background
sets. Loading once at startup keeps per-request latency low.

### 9.2 How a recommendation is produced

For each model the service performs the same disciplined sequence: assemble the
feature vector (including engineered features), apply the **same** fitted scaler
used in training, run inference, map the encoded prediction back to a human label,
and attach a confidence score, a top-3 ranking and an advisory message.

A crop-name **normalisation step** ensures the confirmed crop is interpreted
consistently across models: the crop model emits lowercase labels (e.g. `rice`),
while the fertilizer and irrigation encoders were trained on category labels (e.g.
`Rice`, `Fruits`). The service maps each predicted crop to the correct encoder
label, with an agronomic category fallback (e.g. *apple → Fruits*), so crop-aware
mode functions correctly instead of silently defaulting.

### 9.3 REST endpoints

| Endpoint | Model | Notes |
|---|---|---|
| `POST /api/recommend/crop` | Crop ensemble | returns crop + top-3 + confidence |
| `POST /api/recommend/fertilizer` | TabNet fertilizer | `crop_aware` flag + NPK status |
| `POST /api/recommend/irrigation` | TTL | `crop_aware` flag + water volume |
| `POST /api/recommend/soil` | TabNet soil | optional LIME explanation |
| `POST /api/recommend/complete` | all (chained) | full report after a crop is confirmed |
| `POST /api/recommend/explain` | TabNet ×2 | LIME feature attributions |

### 9.4 End-to-end working flow

```
ESP32 sensors ──MQTT──► FastAPI ──► MongoDB (store)
                          │
        Weather API ──────┘
                          │
            (user opens the ML Advisor)
                          ▼
   ┌──────────────────────────────────────────────────────────┐
   │ 1. Crop model runs on sensor + weather features           │
   │    → returns top-3 crops + confidence                     │
   │ 2. Farmer confirms a crop (optional)                      │
   │ 3a. No crop confirmed → fertilizer & irrigation run in    │
   │     GENERAL (sensor-based) mode                           │
   │ 3b. Crop confirmed → fertilizer & irrigation run in       │
   │     CROP-AWARE mode (crop fed into both models;           │
   │     irrigation also uses the FAO-56 Kc for that crop)     │
   │ 4. Soil fertility runs on N,P,K,pH,moisture (+ LIME)      │
   │ 5. Complete report = all four results + bilingual advice, │
   │    persisted to MongoDB and exportable as PDF             │
   └──────────────────────────────────────────────────────────┘
```

This flow is the practical realisation of the system's value proposition: the
four models are independently useful, but when the farmer confirms a crop they
become a coordinated decision-support chain personalised to that crop.

---

## 10. Pros, Cons and Limitations

### 10.1 Crop ensemble (RF + XGBoost + LightGBM)

**Pros:** highest practical accuracy on the available data (95.15%); excellent
data efficiency on small tabular sets; low variance through soft voting; fast
CPU training and inference; native feature importance; trivial serialisation;
well-calibrated top-3 output suited to giving farmers options.

**Cons / limitations:** tree ensembles do not extrapolate beyond the range of the
training data; the model is only as representative as its data, and 800 of the
2,200 crop samples are synthetic (for four crops absent from the real dataset);
the real portion derives from a Kaggle dataset based on Indian conditions, so
predictions may not perfectly match Nepali micro-climates; the ensemble artefact
is larger on disk than a single tree model.

### 10.2 Irrigation (TTL / FT-Transformer)

**Pros:** very high accuracy (97.67%); naturally handles mixed numerical and
categorical features; genuinely crop-aware via embeddings and FAO-56 coefficients.

**Cons / limitations:** the 12,000-sample dataset is a hybrid whose labels are
rule-based (FAO-56), so the model partly learns an agronomic rule system rather
than purely empirical outcomes; a transformer is heavier to train than a tree
model and benefits from more data.

### 10.3 Soil fertility and fertilizer (TabNet + LIME)

**Pros:** strong accuracy (99.44% and 97.43%); built-in attention-based feature
selection; per-prediction LIME explanations support farmer trust and transparency.

**Cons / limitations:** the soil dataset is fully synthetic (NARC thresholds) and
the fertilizer dataset is largely synthetic (10,000 of 10,099 rows), so both
encode expert rules more than observed field outcomes; minority fertilizer classes
(DAP, MOP) have small support, lowering macro-averaged metrics; LIME explanations
are local approximations and can vary slightly between runs.

### 10.4 System-level limitations

NPK values are currently entered manually (no NPK sensor yet); models use fixed
weights after offline training (no online learning); and accuracy is validated
against datasets, not yet against real harvest outcomes in the Far Western region.
These are documented as directions for future work.

---

## 11. Deep Learning vs. Tree-Based Models for Tabular Data — Discussion

The crop-model decision reflects a broader, well-documented principle in machine
learning research: **for typical tabular datasets, tree-based ensembles
frequently match or outperform deep neural networks**, particularly when data is
limited. Grinsztajn et al. (2022) showed across many benchmarks that tree-based
models remain state-of-the-art on tabular data, attributing this to their
robustness to uninformative features, their handling of irregular decision
boundaries, and their lower sensitivity to feature scaling and hyper-parameters.

This project provides a concrete instance of that principle. The crop dataset —
small, structured, with a few hundred examples per class — is exactly the regime
where deep architectures overfit and trees excel, which is borne out by the
73.64% → 95.15% jump. Conversely, where the data was larger and mixed-type
(irrigation, 12,000 samples) or where per-prediction interpretability was the
priority (soil and fertilizer), deep tabular architectures (FT-Transformer,
TabNet) were appropriate and performed strongly. The project therefore does not
adopt a dogmatic "deep learning everywhere" or "trees everywhere" stance; it
**matches the algorithm to the data regime and the requirement**, which is the
central methodological lesson of the ML work.

---

## 12. References

[1] L. Breiman, "Random Forests," *Machine Learning*, vol. 45, no. 1, pp. 5–32, 2001.

[2] T. Chen and C. Guestrin, "XGBoost: A Scalable Tree Boosting System," in *Proc. 22nd ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining (KDD '16)*, 2016, pp. 785–794.

[3] G. Ke et al., "LightGBM: A Highly Efficient Gradient Boosting Decision Tree," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 30, 2017.

[4] S. Ö. Arik and T. Pfister, "TabNet: Attentive Interpretable Tabular Learning," in *Proc. AAAI Conf. Artificial Intelligence*, vol. 35, no. 8, 2021, pp. 6679–6687.

[5] Y. Gorishniy, I. Rubachev, V. Khrulkov, and A. Babenko, "Revisiting Deep Learning Models for Tabular Data," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 34, 2021.

[6] N. V. Chawla, K. W. Bowyer, L. O. Hall, and W. P. Kegelmeyer, "SMOTE: Synthetic Minority Over-sampling Technique," *Journal of Artificial Intelligence Research*, vol. 16, pp. 321–357, 2002.

[7] M. T. Ribeiro, S. Singh, and C. Guestrin, "'Why Should I Trust You?': Explaining the Predictions of Any Classifier," in *Proc. 22nd ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining (KDD '16)*, 2016, pp. 1135–1144.

[8] L. Grinsztajn, E. Oyallon, and G. Varoquaux, "Why do tree-based models still outperform deep learning on typical tabular data?," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 35, 2022.

[9] R. G. Allen, L. S. Pereira, D. Raes, and M. Smith, "Crop Evapotranspiration — Guidelines for Computing Crop Water Requirements," *FAO Irrigation and Drainage Paper 56*, Food and Agriculture Organization of the United Nations, Rome, 1998.

---

*This chapter documents the machine learning subsystem as implemented and
evaluated. All accuracy figures are reproducible from `ml/train_models.py` and the
saved reports in `ml/reports/`.*
