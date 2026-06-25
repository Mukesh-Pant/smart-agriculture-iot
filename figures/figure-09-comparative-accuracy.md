# Figure 9: Comparative Test Accuracy Across All Four ML Models

**Report location:** Section 6.2 — Comparative Model Summary
**Type:** Bar chart from the real reported test accuracies
**Output file:** `figures/figure-09-comparative-accuracy.png` (300 DPI)
**Caption to use in report:** *Figure 9: Comparative Test Accuracy Across All Four ML Models*

## Data (from the saved reports / Table 10)
| Model | Test Accuracy |
|---|---|
| Crop Ensemble (RF + XGBoost + LightGBM) | 95.15% |
| Irrigation TTL (FT-Transformer) | 97.67% |
| Soil Fertility (TabNet) | 99.44% |
| Fertilizer (TabNet) | 97.43% |

These values are taken directly from `ml/reports/*.txt` and match Table 6–10 in the report.

## How it was generated
Produced by `backend/ml/make_result_figures.py` (function `make_figure_9`). The y-axis is zoomed to 90–100% so the differences between the four high-performing models are visible, with a dashed reference line at the 90% project target.

## To regenerate
```
cd backend
.\venv\Scripts\python.exe ml\make_result_figures.py
```

## Notes
- Bar colors match the layer/model color scheme used in the Mermaid diagrams (green/blue/purple/rose).
- To start the y-axis at 0 instead of 90, change `ax.set_ylim(90, 100.5)` to `ax.set_ylim(0, 105)`.
