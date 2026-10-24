"""Loads the January 2026 data once and caches the per-cutoff selection."""
from __future__ import annotations

import os
from pathlib import Path

import pandas as pd

from .core import select_forecasts

DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).resolve().parent.parent / "data"))

# Delivery days whose purchase decision is made in January 2026.
FIRST_DAY = "2026-01-02"
LAST_DAY = "2026-02-01"


class Store:
    def __init__(self, data_dir: Path = DATA_DIR):
        a, f = data_dir / "actuals.csv", data_dir / "forecasts.csv"
        if not a.exists() or not f.exists():
            raise FileNotFoundError(
                f"Missing {a.name} / {f.name} in {data_dir}. "
                "Run: python -m scripts.fetch_elexon   (or add --synthetic for fake data)"
            )
        self.actuals = pd.read_csv(a)
        self.forecasts = pd.read_csv(f)
        for df, cols in ((self.actuals, ["startTime"]), (self.forecasts, ["startTime", "publishTime"])):
            for c in cols:
                df[c] = pd.to_datetime(df[c], utc=True)
        self._cache: dict[str, pd.DataFrame] = {}

    def selection(self, cutoff: str) -> pd.DataFrame:
        if cutoff not in self._cache:
            sel = select_forecasts(self.actuals, self.forecasts, cutoff)
            self._cache[cutoff] = sel[(sel["day"] >= FIRST_DAY) & (sel["day"] <= LAST_DAY)].reset_index(drop=True)
        return self._cache[cutoff]
