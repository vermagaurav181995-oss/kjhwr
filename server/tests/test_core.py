import pandas as pd

from app.core import compute_metrics, decision_time, select_forecasts


def ts(s):
    return pd.Timestamp(s, tz="UTC")


def test_decision_time_is_previous_day_uk_time():
    # January is GMT, so UK time == UTC
    assert decision_time("2026-01-15", "09:00") == ts("2026-01-14 09:00")


def test_decision_time_handles_bst():
    # 1 July: UK is UTC+1
    assert decision_time("2026-07-02", "09:00") == ts("2026-07-01 08:00")


def test_picks_latest_forecast_at_or_before_cutoff():
    actuals = pd.DataFrame({"startTime": [ts("2026-01-15 12:00")], "generation": [5000]})
    forecasts = pd.DataFrame({
        "startTime": [ts("2026-01-15 12:00")] * 4,
        "publishTime": [ts("2026-01-13 20:00"), ts("2026-01-14 08:00"), ts("2026-01-14 09:00"), ts("2026-01-14 10:00")],
        "generation": [1000, 2000, 3000, 4000],
    })
    sel = select_forecasts(actuals, forecasts, "09:00")
    assert sel.loc[0, "forecast"] == 3000          # 09:00 exactly is allowed
    assert sel.loc[0, "publishTime"] == ts("2026-01-14 09:00")


def test_never_uses_forecast_published_after_cutoff():
    actuals = pd.DataFrame({"startTime": [ts("2026-01-15 12:00")], "generation": [5000]})
    forecasts = pd.DataFrame({
        "startTime": [ts("2026-01-15 12:00")],
        "publishTime": [ts("2026-01-14 09:30")],
        "generation": [4000],
    })
    sel = select_forecasts(actuals, forecasts, "09:00")
    assert pd.isna(sel.loc[0, "forecast"])         # nothing was available yet


def test_metrics_known_values():
    actuals = pd.DataFrame({
        "startTime": [ts("2026-01-15 12:00"), ts("2026-01-15 12:30")], "generation": [1000, 2000],
    })
    forecasts = pd.DataFrame({
        "startTime": [ts("2026-01-15 12:00"), ts("2026-01-15 12:30")],
        "publishTime": [ts("2026-01-14 08:00")] * 2,
        "generation": [1100, 1700],               # errors +100, -300
    })
    m = compute_metrics(select_forecasts(actuals, forecasts, "09:00"))["summary"]
    assert m["n"] == 2
    assert m["mae"] == 200
    assert m["bias"] == -100
    assert round(m["rmse"]) == round(((100**2 + 300**2) / 2) ** 0.5)
