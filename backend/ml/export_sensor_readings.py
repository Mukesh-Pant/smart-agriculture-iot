# =============================================================
# ml/export_sensor_readings.py
#
# Connects to MongoDB Atlas using the app's own settings (the
# connection string is read from backend/.env and is never
# printed), exports ALL sensor_readings to a local CSV, and
# prints a summary (count, time span, sampling gaps) so we can
# choose the right x-axis for the sensor-trend figure.
#
# Run (from backend/ with venv):
#   .\venv\Scripts\python.exe ml\export_sensor_readings.py
# =============================================================

import os
import sys

BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(BASE_DIR)
OUT_DIR      = os.path.abspath(os.path.join(BACKEND_ROOT, "..", "figures"))
os.makedirs(OUT_DIR, exist_ok=True)
sys.path.insert(0, BACKEND_ROOT)

import pandas as pd
from pymongo import MongoClient, ASCENDING

from app.core.settings import settings  # reads backend/.env

CSV_PATH = os.path.join(OUT_DIR, "sensor_readings_export.csv")
FIELDS = ["received_at", "device_id", "temperature_c", "humidity_pct",
          "soil_moisture_pct", "ph_value", "moisture_level", "ph_category",
          "has_errors"]


def main():
    is_atlas = "mongodb+srv://" in settings.MONGO_URI
    print(f"Connecting to MongoDB ({'Atlas' if is_atlas else 'local'})... "
          f"db='{settings.MONGO_DB_NAME}', collection='{settings.MONGO_COL_SENSOR_READINGS}'")
    # NOTE: the URI/credential is intentionally never printed.

    client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=15000)
    client.admin.command("ping")
    col = client[settings.MONGO_DB_NAME][settings.MONGO_COL_SENSOR_READINGS]

    total = col.count_documents({})
    print(f"Total documents in collection: {total}")

    cursor = col.find({}, {f: 1 for f in FIELDS}).sort("received_at", ASCENDING)
    docs = list(cursor)
    client.close()

    if not docs:
        print("No documents found — nothing to export.")
        return

    df = pd.DataFrame(docs)
    if "_id" in df.columns:
        df = df.drop(columns=["_id"])
    for f in FIELDS:
        if f not in df.columns:
            df[f] = pd.NA
    df = df[FIELDS]
    df["received_at"] = pd.to_datetime(df["received_at"], errors="coerce")
    df = df.sort_values("received_at").reset_index(drop=True)
    df.to_csv(CSV_PATH, index=False)
    print(f"Exported {len(df)} rows -> {CSV_PATH}")

    # ---- summary for x-axis decision ----
    ts = df["received_at"].dropna()
    print("\n--- Summary ---")
    print(f"Rows with valid timestamp: {len(ts)} / {len(df)}")
    if len(ts) >= 2:
        span = ts.iloc[-1] - ts.iloc[0]
        print(f"First reading: {ts.iloc[0]}")
        print(f"Last  reading: {ts.iloc[-1]}")
        print(f"Total span   : {span}  ({span.total_seconds()/3600:.2f} hours)")
        gaps = ts.diff().dropna().dt.total_seconds()
        print(f"Median gap between readings: {gaps.median():.1f} s")
        print(f"Max gap between readings   : {gaps.max():.1f} s "
              f"({gaps.max()/3600:.2f} h)")
        big = gaps[gaps > 300]
        print(f"Gaps > 5 min: {len(big)} (these indicate separate capture sessions)")
        print(f"Distinct devices: {df['device_id'].nunique()} -> "
              f"{df['device_id'].dropna().unique().tolist()[:5]}")
    print("\nColumn non-null counts:")
    for c in ["temperature_c", "humidity_pct", "soil_moisture_pct", "ph_value"]:
        print(f"  {c:<20s}: {df[c].notna().sum()} non-null")


if __name__ == "__main__":
    main()
