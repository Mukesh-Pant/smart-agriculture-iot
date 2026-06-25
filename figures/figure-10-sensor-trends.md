# Figure 10: Sensor Reading Trends (Continuous Capture)

**Report location:** Section 6.3 — Sensor Validation
**Type:** Real measured sensor data (no synthetic values)
**Output file:** `figures/figure-10-sensor-trends.png` (300 DPI)
**Caption to use in report:** *Figure 10: Sensor Reading Trends — ~53-Minute Continuous Capture (102 readings, field node farm_node_01, 2026-06-22)*

## Why this is not a "24-hour" figure
The MongoDB Atlas `sensor_readings` collection currently holds **324 readings total**, spanning 62 days across ~10 short capture sessions and two devices. There is no continuous 24-hour run, so labeling the figure "24-Hour Sensor Reading Trends" would misrepresent the data. Instead, this figure plots the **largest genuinely continuous session**:

- Device: `farm_node_01` (the field node; the single `esp32_test_01` ping is excluded)
- Session: **102 readings over ~53 minutes** on 2026-06-22 (04:03 → 04:57)
- Sampling: ~30 s median interval

This is honest, real, continuous data and directly supports the stability narrative.

## How it was generated (two steps)
1. **Export from Atlas** (reads the connection string from `backend/.env`, never prints it):
   ```
   cd backend
   .\venv\Scripts\python.exe ml\export_sensor_readings.py
   ```
   Produces `figures/sensor_readings_export.csv` (all 324 readings) and prints a span/gap summary.
2. **Plot the largest continuous session:**
   ```
   .\venv\Scripts\python.exe ml\make_sensor_trend_figure.py
   ```
   Reads the CSV, selects `farm_node_01`'s biggest gap-free run (gap ≤ 120 s), and renders a 2×2 grid (temperature, humidity, soil moisture, pH) vs elapsed minutes, each panel annotated with mean ± σ.

Step 2 needs no database access, so the figure is reproducible from the committed CSV alone.

## Notes / options
- To plot **all** `farm_node_01` readings by sequence index instead of one session, we can switch the x-axis to reading number — tell me if you prefer that view.
- The `mean ± σ` band per panel is the "stability analysis" element; sensor values stay tight around their means over the capture.
