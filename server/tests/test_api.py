"""API smoke tests. Needs data/ (run `python -m scripts.fetch_elexon --synthetic` first)."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import DATA_DIR

pytestmark = pytest.mark.skipif(not (DATA_DIR / "actuals.csv").exists(), reason="no data files")


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:   # the `with` runs the startup that loads the data
        yield c


def test_forecast_shape(client):
    r = client.get("/api/forecast", params={"day": "2026-01-15", "cutoff": "09:00"})
    assert r.status_code == 200
    body = r.json()
    assert len(body["points"]) == 48
    assert set(body["points"][0]) == {"time", "actual", "forecast", "publishTime"}


def test_forecast_never_published_after_cutoff(client):
    pts = client.get("/api/forecast", params={"day": "2026-01-15", "cutoff": "09:00"}).json()["points"]
    assert all(p["publishTime"] is None or p["publishTime"] <= "2026-01-14T09:00:00Z" for p in pts)


def test_bad_inputs(client):
    assert client.get("/api/forecast", params={"day": "2026-03-01"}).status_code == 404
    assert client.get("/api/forecast", params={"day": "2026-01-15", "cutoff": "9am"}).status_code == 422


def test_metrics_scope(client):
    month = client.get("/api/metrics", params={"cutoff": "09:00"}).json()
    day = client.get("/api/metrics", params={"cutoff": "09:00", "date_from": "2026-01-15", "date_to": "2026-01-15"}).json()
    assert month["summary"]["n"] > day["summary"]["n"] == 48