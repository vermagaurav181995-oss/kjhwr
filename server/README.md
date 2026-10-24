# Wind forecast API (backend)

FastAPI + pandas. Serves the data the React app needs from two Elexon datasets:
FUELHH (wind actuals) and WINDFOR (wind forecasts), for decisions made in January 2026.

## Layout
```
app/core.py            forecast selection + error metrics (pure pandas, unit-tested)
app/store.py           loads CSVs once, caches the selection per cutoff time
app/main.py            FastAPI routes
scripts/fetch_elexon.py  downloads data from Elexon into data/ (or --synthetic for fake data)
tests/test_core.py     tests for the selection and metric logic
data/                  actuals.csv, forecasts.csv (commit these so deploys need no download)
```

## Run locally
```
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m scripts.fetch_elexon          # real data; add --synthetic to try it offline
uvicorn app.main:app --reload --port 8000
pytest
```
Docs UI: http://localhost:8000/docs

## Endpoints
- `GET /api/forecast?day=2026-01-15&cutoff=09:00` half-hourly actual vs the forecast current at the cutoff
- `GET /api/metrics?cutoff=09:00[&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD]` accuracy summary and breakdowns
- `GET /api/meta`, `GET /api/health`

## How the forecast is chosen
For delivery day D and cutoff C, each target half-hour uses the forecast with the latest
`publishTime` at or before C on day D-1 (UK local time). Forecasts published later are never used.
Error = forecast - actual, in MW. Percentiles are of the absolute error.
Delivery days are 2 Jan to 1 Feb 2026, i.e. decisions made in January.

## Deploy on Render (web service)
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env vars: `PYTHON_VERSION=3.12.3`, `CORS_ORIGINS=https://<your-frontend-url>`
- Free instances sleep when idle, so open the URL once before recording or submitting.
