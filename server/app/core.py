"""Pure data logic: forecast selection and error metrics. No web code here,
so it can be tested and reasoned about on its own.

Key idea: a buyer deciding on day D-1 at a cutoff time can only use forecasts
published at or before that moment. For every target half-hour we therefore
pick the forecast with the latest publishTime <= cutoff (on D-1, UK time).
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from zoneinfo import ZoneInfo

LONDON = ZoneInfo("Europe/London")
NS_UTC = "datetime64[ns, UTC]"


def decision_time(day: str, cutoff: str) -> pd.Timestamp:
    """UTC instant of `cutoff` (UK local time, HH:MM) on the day before `day`."""
    d = pd.Timestamp(day) - pd.Timedelta(days=1)
    hh, mm = (int(x) for x in cutoff.split(":"))
    local = pd.Timestamp(year=d.year, month=d.month, day=d.day, hour=hh, minute=mm, tz=LONDON)
    return local.tz_convert("UTC")


def delivery_day(ts: pd.Series) -> pd.Series:
    """UK-local calendar date (YYYY-MM-DD) of each UTC timestamp."""
    return ts.dt.tz_convert(LONDON).dt.strftime("%Y-%m-%d")


def select_forecasts(actuals: pd.DataFrame, forecasts: pd.DataFrame, cutoff: str) -> pd.DataFrame:
    """Join actuals with the forecast that was current at the decision time.

    actuals:   columns startTime (UTC), generation
    forecasts: columns startTime (UTC), publishTime (UTC), generation
    returns:   startTime, day, actual, forecast, publishTime
               (forecast/publishTime are NaN/NaT when nothing had been published yet)
    """
    left = actuals[["startTime", "generation"]].rename(columns={"generation": "actual"}).copy()
    left["startTime"] = left["startTime"].astype(NS_UTC)
    left["day"] = delivery_day(left["startTime"])

    cutoffs = {d: decision_time(d, cutoff) for d in left["day"].unique()}
    left["decision"] = left["day"].map(cutoffs).astype(NS_UTC)

    right = forecasts[["startTime", "publishTime", "generation"]].rename(columns={"generation": "forecast"}).copy()
    right["startTime"] = right["startTime"].astype(NS_UTC)
    right["publishTime"] = right["publishTime"].astype(NS_UTC)

    left = left.sort_values("decision")
    right = right.sort_values("publishTime")
    out = pd.merge_asof(
        left, right,
        left_on="decision", right_on="publishTime",
        by="startTime", direction="backward",
    )
    return out.drop(columns=["decision"]).sort_values("startTime").reset_index(drop=True)


def _r(x, nd: int = 1):
    return None if x is None or (isinstance(x, float) and np.isnan(x)) else round(float(x), nd)


def compute_metrics(sel: pd.DataFrame, date_from: str | None = None, date_to: str | None = None) -> dict:
    """Accuracy of the selected forecasts. Error = forecast - actual (MW)."""
    df = sel.dropna(subset=["forecast", "actual"]).copy()
    if date_from:
        df = df[df["day"] >= date_from]
    if date_to:
        df = df[df["day"] <= date_to]
    if df.empty:
        return {"summary": {"n": 0}, "byHour": [], "byHorizon": []}

    df["err"] = df["forecast"] - df["actual"]
    df["abs"] = df["err"].abs()
    nz = df[df["actual"] > 0]
    summary = {
        "n": int(len(df)),
        "mae": _r(df["abs"].mean()),
        "rmse": _r(np.sqrt((df["err"] ** 2).mean())),
        "bias": _r(df["err"].mean()),
        "mape": _r((nz["abs"] / nz["actual"]).mean() * 100) if len(nz) else None,
        "p50": _r(np.percentile(df["abs"], 50)),
        "p90": _r(np.percentile(df["abs"], 90)),
        "p95": _r(np.percentile(df["abs"], 95)),
    }

    df["hour"] = df["startTime"].dt.tz_convert(LONDON).dt.hour
    g = df.groupby("hour").agg(mae=("abs", "mean"), bias=("err", "mean")).reset_index()
    by_hour = [{"hour": int(r.hour), "mae": _r(r.mae), "bias": _r(r.bias)} for r in g.itertuples()]

    # Forecast age at the target time, in 3-hour buckets.
    age_h = (df["startTime"] - df["publishTime"]).dt.total_seconds() / 3600
    df["horizon"] = (np.round(age_h / 3) * 3).astype(int)
    h = df.groupby("horizon").agg(mae=("abs", "mean"), n=("abs", "size")).reset_index()
    by_hz = [{"horizon": int(r.horizon), "mae": _r(r.mae)} for r in h.itertuples() if r.n >= 10]

    return {"summary": summary, "byHour": by_hour, "byHorizon": by_hz}


def day_points(sel: pd.DataFrame, day: str) -> list[dict]:
    """Half-hourly rows for one delivery day, in the shape the UI expects."""
    d = sel[sel["day"] == day]
    pts = []
    for r in d.itertuples():
        pts.append({
            "time": r.startTime.tz_convert(LONDON).strftime("%H:%M"),
            "actual": None if pd.isna(r.actual) else int(round(r.actual)),
            "forecast": None if pd.isna(r.forecast) else int(round(r.forecast)),
            "publishTime": None if pd.isna(r.publishTime) else r.publishTime.strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
    return pts
