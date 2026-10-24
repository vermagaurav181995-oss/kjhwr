"""Sanity-check the downloaded data. Run after fetch_elexon:  python -m scripts.check_data"""
import pandas as pd

from app.core import select_forecasts
from app.store import DATA_DIR, FIRST_DAY, LAST_DAY, Store


def main():
    s = Store(DATA_DIR)
    a, f = s.actuals, s.forecasts
    print(f"actuals:   {len(a):,} rows  {a.startTime.min()} .. {a.startTime.max()}")
    print(f"           duplicates: {a.startTime.duplicated().sum()}   (expect 1488 rows for 2 Jan - 1 Feb)")
    print(f"forecasts: {len(f):,} rows  published {f.publishTime.min()} .. {f.publishTime.max()}")
    print(f"           distinct publish times: {f.publishTime.nunique()}")
    steps = f.startTime.drop_duplicates().sort_values().diff().dropna().value_counts().head(2)
    print(f"           target spacing (should be 0 days 00:30:00): {dict(steps)}")
    horizon = (f.startTime - f.publishTime).dt.total_seconds() / 3600
    print(f"           horizon hours: min {horizon.min():.1f}  max {horizon.max():.1f}")
    for cutoff in ("09:00", "12:00"):
        sel = s.selection(cutoff)
        covered = sel.forecast.notna().mean() * 100
        print(f"cutoff {cutoff}: {len(sel)} target half-hours, {covered:.1f}% have a forecast available")
        missing = sel[sel.forecast.isna()].day.value_counts().head(3)
        if len(missing):
            print(f"           days with gaps: {dict(missing)}")


if __name__ == "__main__":
    main()