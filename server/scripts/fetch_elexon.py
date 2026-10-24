"""Download the January 2026 data from Elexon and save it as CSV in ./data.

Usage (from the backend folder):
    python -m scripts.fetch_elexon              # real data from Elexon
    python -m scripts.fetch_elexon --synthetic  # fake but realistic data, no network

Endpoints and parameter names follow Elexon's BMRS API docs; if a request is
rejected, check the "Try it out" panel on the docs page for the current names.
"""
from __future__ import annotations

import argparse
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import requests

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
OUT = Path(__file__).resolve().parent.parent / "data"

# Delivery days 2 Jan - 1 Feb 2026 (decided 1 Jan - 31 Jan).
ACTUALS_FROM, ACTUALS_TO = date(2026, 1, 2), date(2026, 2, 1)
# Forecasts published from the day before the first decision to the last decision day.
PUBLISH_FROM = datetime(2025, 12, 31, tzinfo=timezone.utc)
PUBLISH_TO = datetime(2026, 2, 1, tzinfo=timezone.utc)


def get_json(url: str, params: dict, retries: int = 3):
    for attempt in range(retries):
        r = requests.get(url, params=params, timeout=60, headers={"Accept": "application/json"})
        if r.status_code == 200:
            return r.json()
        if attempt < retries - 1:
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"{r.status_code} from {r.url}: {r.text[:300]}")


def fetch_actuals() -> pd.DataFrame:
    rows, d = [], ACTUALS_FROM
    while d <= ACTUALS_TO:
        end = min(d + timedelta(days=6), ACTUALS_TO)
        data = get_json(f"{BASE}/FUELHH/stream", {
            "settlementDateFrom": d.isoformat(), "settlementDateTo": end.isoformat(), "fuelType": "WIND",
        })
        rows += [x for x in data if x.get("fuelType") == "WIND"]
        d = end + timedelta(days=1)
    df = pd.DataFrame(rows)[["startTime", "generation"]].drop_duplicates("startTime")
    return df.sort_values("startTime")


def fetch_forecasts() -> pd.DataFrame:
    rows, t = [], PUBLISH_FROM
    while t < PUBLISH_TO:
        end = min(t + timedelta(days=2), PUBLISH_TO)
        data = get_json(f"{BASE}/WINDFOR/stream", {
            "publishDateTimeFrom": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
        rows += data
        t = end
    df = pd.DataFrame(rows)[["startTime", "publishTime", "generation"]]
    return df.drop_duplicates(["startTime", "publishTime"]).sort_values(["publishTime", "startTime"])


def synthetic() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Plausible fake data: smooth wind with forecast error that grows with horizon."""
    rng = np.random.default_rng(42)
    times = pd.date_range("2026-01-01", "2026-02-04", freq="30min", tz="UTC")
    x = np.zeros(len(times))
    for i in range(1, len(times)):
        x[i] = 0.995 * x[i - 1] + rng.normal(0, 120)
    actual = np.clip(7000 + x * 3 + 1500 * np.sin(np.arange(len(times)) / 48 * 2 * np.pi * 0.3), 300, 14000)
    actuals = pd.DataFrame({"startTime": times, "generation": actual.round()})

    rows = []
    for p in pd.date_range("2025-12-31", "2026-02-01", freq="1h", tz="UTC"):
        bias = rng.normal(0, 400)
        targets = pd.date_range(p + pd.Timedelta(hours=1), p + pd.Timedelta(hours=48), freq="30min")
        targets = targets[targets <= times[-1]]
        idx = times.get_indexer(targets)
        ok = idx >= 0
        targets, idx = targets[ok], idx[ok]
        horizon_h = (targets - p) / pd.Timedelta(hours=1)
        noise = rng.normal(0, 350 + 70 * horizon_h) + bias
        fc = np.clip(actual[idx] + noise, 0, None).round()
        rows.append(pd.DataFrame({"startTime": targets, "publishTime": p, "generation": fc}))
    return actuals, pd.concat(rows, ignore_index=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--synthetic", action="store_true", help="generate fake data instead of calling Elexon")
    args = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    if args.synthetic:
        actuals, forecasts = synthetic()
    else:
        actuals, forecasts = fetch_actuals(), fetch_forecasts()
    for df, name in ((actuals, "actuals.csv"), (forecasts, "forecasts.csv")):
        for c in ("startTime", "publishTime"):
            if c in df:
                df[c] = pd.to_datetime(df[c], utc=True).dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        df.to_csv(OUT / name, index=False)
        print(f"wrote {OUT / name}: {len(df):,} rows")


if __name__ == "__main__":
    main()
