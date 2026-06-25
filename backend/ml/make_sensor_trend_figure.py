# =============================================================
# ml/make_sensor_trend_figure.py
#
# Figure 10 — Sensor Reading Trends.
# Plots the LARGEST continuous capture session of the real field
# node (farm_node_01) from the exported readings CSV. This is a
# genuine continuous run (no fabricated data); the test-ping
# device (esp32_test_01) and inter-session gaps are excluded.
#
# Input : figures/sensor_readings_export.csv
#         (produced by ml/export_sensor_readings.py)
# Output: figures/figure-10-sensor-trends.png  (300 DPI)
#
# Run (from backend/ with venv):
#   .\venv\Scripts\python.exe ml\make_sensor_trend_figure.py
# =============================================================

import os
import sys
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIG_DIR  = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "figures"))
CSV_PATH = os.path.join(FIG_DIR, "sensor_readings_export.csv")
OUT_PATH = os.path.join(FIG_DIR, "figure-10-sensor-trends.png")

FIELD_DEVICE = "farm_node_01"
GAP_SECONDS  = 120  # readings within 2 min belong to the same continuous session


def largest_session(df):
    df = df.sort_values("received_at").reset_index(drop=True)
    gaps = df["received_at"].diff().dt.total_seconds()
    session_id = (gaps > GAP_SECONDS).cumsum()
    biggest = session_id.value_counts().idxmax()
    seg = df[session_id == biggest].sort_values("received_at").reset_index(drop=True)
    return seg


def main():
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: {CSV_PATH} not found. Run ml/export_sensor_readings.py first.")
        return

    df = pd.read_csv(CSV_PATH, parse_dates=["received_at"])
    df = df[df["device_id"] == FIELD_DEVICE].copy()
    seg = largest_session(df)

    t0 = seg["received_at"].iloc[0]
    minutes = (seg["received_at"] - t0).dt.total_seconds() / 60.0
    span_min = minutes.iloc[-1]
    print(f"Largest continuous session: {len(seg)} readings over {span_min:.1f} min")
    print(f"  start={seg['received_at'].iloc[0]}  end={seg['received_at'].iloc[-1]}")

    panels = [
        ("temperature_c",     "Temperature (°C)",   "#dc2626"),
        ("humidity_pct",      "Humidity (%)",       "#2563eb"),
        ("soil_moisture_pct", "Soil Moisture (%)",  "#16a34a"),
        ("ph_value",          "pH",                 "#9333ea"),
    ]

    fig, axes = plt.subplots(2, 2, figsize=(12, 7.5), sharex=True)
    axes = axes.ravel()

    for ax, (col, label, color) in zip(axes, panels):
        y = seg[col].astype(float)
        mean, std = y.mean(), y.std()
        ax.plot(minutes, y, color=color, linewidth=1.4, marker="o",
                markersize=2.5, alpha=0.9)
        ax.axhline(mean, color=color, linestyle="--", linewidth=1.0, alpha=0.7)
        ax.fill_between(minutes, mean - std, mean + std, color=color, alpha=0.10)
        ax.set_ylabel(label, fontsize=10)
        ax.grid(alpha=0.3)
        ax.set_axisbelow(True)
        ax.text(0.02, 0.95, f"mean = {mean:.2f}\nσ = {std:.2f}",
                transform=ax.transAxes, va="top", ha="left", fontsize=9,
                bbox=dict(boxstyle="round,pad=0.3", fc="white", ec=color, alpha=0.8))

    for ax in axes[2:]:
        ax.set_xlabel("Elapsed time (minutes)", fontsize=10)

    fig.suptitle(
        f"Sensor Reading Trends — Continuous Capture on {t0.strftime('%Y-%m-%d')} "
        f"({len(seg)} readings over ~{span_min:.0f} min, device {FIELD_DEVICE})",
        fontsize=13, y=0.98)
    fig.tight_layout(rect=[0, 0, 1, 0.96])
    fig.savefig(OUT_PATH, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"saved -> {OUT_PATH}")


if __name__ == "__main__":
    main()
