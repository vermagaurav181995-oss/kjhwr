import numpy as np
import pandas as pd


def select_forecasts(actuals_df, forecasts_df, delivery_date, cutoff_time):
  """For delivery day D and cutoff C, each target half-hour uses the forecast

  with the latest publishTime at or before C on day D-1 (UK local time).
  """
  d_day = pd.to_datetime(delivery_date).normalize()
  prev_day = d_day - pd.Timedelta(days=1)
  cutoff_dt = pd.to_datetime(f"{prev_day.strftime('%Y-%m-%d')} {cutoff_time}")

  if forecasts_df.empty or actuals_df.empty:
    return pd.DataFrame(columns=["startTime", "actual", "forecast", "error"])

  fc = forecasts_df.copy()
  act = actuals_df.copy()

  fc["startTime"] = pd.to_datetime(fc["startTime"])
  fc["publishTime"] = pd.to_datetime(fc["publishTime"])
  act["startTime"] = pd.to_datetime(act["startTime"])

  # Rule: forecasts published at or before cutoff on D-1 targeting delivery day D
  f_sub = fc[
      (fc["publishTime"] <= cutoff_dt)
      & (fc["startTime"].dt.date == d_day.date())
  ].copy()

  if f_sub.empty:
    return pd.DataFrame(columns=["startTime", "actual", "forecast", "error"])

  # Pick the latest publishTime for each half-hourly target start time
  f_latest = (
      f_sub.sort_values("publishTime").groupby("startTime").last().reset_index()
  )

  a_sub = act[act["startTime"].dt.date == d_day.date()].copy()

  merged = pd.merge(
      a_sub,
      f_latest,
      on="startTime",
      suffixes=("_actual", "_forecast"),
      how="inner",
  )
  if merged.empty:
    return pd.DataFrame(columns=["startTime", "actual", "forecast", "error"])

  # Error = Forecast - Actual (in MW)
  merged["error"] = merged["generation_forecast"] - merged["generation_actual"]
  return merged[[
      "startTime",
      "generation_actual",
      "generation_forecast",
      "error",
  ]].rename(
      columns={
          "generation_actual": "actual",
          "generation_forecast": "forecast",
      }
  )


def compute_metrics(merged_df):
  if merged_df.empty or "error" not in merged_df.columns:
    return {
        "count": 0,
        "mae": 0.0,
        "rmse": 0.0,
        "bias": 0.0,
        "p50_abs_error": 0.0,
        "p90_abs_error": 0.0,
    }

  err = merged_df["error"]
  abs_err = err.abs()
  return {
      "count": int(len(merged_df)),
      "mae": float(abs_err.mean()),
      "rmse": float(np.sqrt((err**2).mean())),
      "bias": float(err.mean()),  # positive = overforecast, negative = underforecast
      "p50_abs_error": float(abs_err.quantile(0.50)),
      "p90_abs_error": float(abs_err.quantile(0.90)),
  }