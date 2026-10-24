import argparse
from datetime import datetime, timedelta
import os
import pandas as pd
import requests

ACTUALS_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream"
FORECASTS_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"
DATA_DIR = "data"


def fetch_data(synthetic=False):
  os.makedirs(DATA_DIR, exist_ok=True)
  if synthetic:
    print("Generating high-fidelity synthetic data for January 2026...")
    dates = pd.date_range(
        start="2026-01-01", end="2026-02-01 23:30", freq="30min"
    )
    # Realistic wind profile with sinusoidal patterns and weather volatility
    np_rng = np.random.default_rng(42)
    base_wind = 4500 + 2500 * np.sin(
        np.linspace(0, 50 * np.pi, len(dates))
    ) + np_rng.normal(0, 400, len(dates))
    actuals = pd.DataFrame({
        "startTime": dates,
        "generation": np.clip(base_wind, 200, 12000),
    })
    actuals.to_csv(os.path.join(DATA_DIR, "actuals.csv"), index=False)

    forecast_rows = []
    for d in pd.date_range(start="2026-01-02", end="2026-02-01"):
      d_prev = d - timedelta(days=1)
      for publish_hour in [9, 12, 16, 22]:
        pub_time = d_prev.normalize() + timedelta(hours=publish_hour)
        # Introduce forecast error that grows with horizon
        noise_factor = (24 - publish_hour) * 15
        for target_time in pd.date_range(
            start=d, end=d + timedelta(hours=23.5), freq="30min"
        ):
          # Match index for base actual
          act_val = actuals.loc[
              actuals["startTime"] == target_time, "generation"
          ].values
          base_val = act_val[0] if len(act_val) > 0 else 5000
          fc_val = base_val + np_rng.normal(0, 300 + noise_factor)
          forecast_rows.append({
              "startTime": target_time,
              "publishTime": pub_time,
              "generation": np.clip(fc_val, 200, 12000),
          })
    forecasts = pd.DataFrame(forecast_rows)
    forecasts.to_csv(os.path.join(DATA_DIR, "forecasts.csv"), index=False)
    print("Synthetic data generated successfully.")
    return

  print("Fetching real Elexon BMRS data for January 2026...")
  params_act = {
      "publishDateTimeFrom": "2026-01-01T00:00:00Z",
      "publishDateTimeTo": "2026-02-01T23:59:59Z",
      "fuelType": "WIND",
  }
  r_act = requests.get(ACTUALS_URL, params=params_act)
  if r_act.status_code == 200:
    df_act = pd.DataFrame(r_act.json())
    df_act.to_csv(os.path.join(DATA_DIR, "actuals.csv"), index=False)

  params_fc = {
      "publishDateTimeFrom": "2025-12-31T00:00:00Z",
      "publishDateTimeTo": "2026-02-01T23:59:59Z",
  }
  r_fc = requests.get(FORECASTS_URL, params=params_fc)
  if r_fc.status_code == 200:
    df_fc = pd.DataFrame(r_fc.json())
    df_fc.to_csv(os.path.join(DATA_DIR, "forecasts.csv"), index=False)
  print("Elexon data download complete.")


if __name__ == "__main__":
  import numpy as np

  parser = argparse.ArgumentParser()
  parser.add_argument(
      "--synthetic",
      action="store_true",
      help="Generate robust sample data offline",
  )
  args = parser.parse_args()
  fetch_data(synthetic=args.synthetic)