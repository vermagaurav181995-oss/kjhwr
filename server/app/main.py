from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.core import compute_metrics, select_forecasts
from app.store import store
import pandas as pd

app = FastAPI(title="UK Wind Power Forecast Desk API", version="1.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
  return {
      "status": "healthy",
      "actuals_count": len(store.actuals),
      "forecasts_count": len(store.forecasts),
  }


@app.get("/api/forecast")
def get_forecast(day: str = "2026-01-15", cutoff: str = "09:00"):
  try:
    df = select_forecasts(store.actuals, store.forecasts, day, cutoff)
    records = []
    for _, row in df.iterrows():
      records.append({
          "startTime": row["startTime"].isoformat(),
          "actual": float(row["actual"]),
          "forecast": float(row["forecast"]),
          "error": float(row["error"]),
      })
    metrics = compute_metrics(df)
    return {"day": day, "cutoff": cutoff, "metrics": metrics, "data": records}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics")
def get_metrics_summary(
    cutoff: str = "09:00",
    date_from: str = "2026-01-02",
    date_to: str = "2026-02-01",
):
  try:
    all_days = pd.date_range(start=date_from, end=date_to, freq="D")
    frames = []
    for d in all_days:
      day_str = d.strftime("%Y-%m-%d")
      sub = select_forecasts(store.actuals, store.forecasts, day_str, cutoff)
      if not sub.empty:
        sub["day"] = day_str
        frames.append(sub)

    if not frames:
      return {"summary": {}, "daily": []}

    combined = pd.concat(frames, ignore_index=True)
    overall_metrics = compute_metrics(combined)

    daily_summary = []
    for day_str, group in combined.groupby("day"):
      m = compute_metrics(group)
      m["day"] = day_str
      daily_summary.append(m)

    return {"summary": overall_metrics, "daily": daily_summary}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))