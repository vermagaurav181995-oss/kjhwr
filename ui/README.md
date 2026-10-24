# Wind forecast desk (frontend)

React + Vite. Charts with Recharts.

## Run
```
npm install
npm run dev
```
Opens on http://localhost:5173. `/api/*` is proxied to FastAPI on http://localhost:8000.
If the backend is down, the UI shows sample data and a notice.

For production set `VITE_API_URL` to the backend URL (see `.env.example`) and run `npm run build`.

## API contract the backend must provide

`GET /api/forecast?day=2026-01-15&cutoff=09:00`
```json
{ "day": "2026-01-15", "cutoff": "09:00",
  "points": [ { "time": "00:00", "actual": 5210, "forecast": 4980, "publishTime": "2026-01-14T08:45:00Z" } ] }
```
48 points, one per half-hour of the delivery day. `forecast` is the latest forecast published at or before the cutoff on the previous day.

`GET /api/metrics?cutoff=09:00` (all January decisions)
```json
{ "cutoff": "09:00",
  "summary": { "n": 1488, "mae": 1020, "rmse": 1380, "bias": -140, "mape": 12.4, "p50": 790, "p90": 2150, "p95": 2640 },
  "byHour": [ { "hour": 0, "mae": 900, "bias": -50 } ],
  "byHorizon": [ { "horizon": 15, "mae": 800 } ] }
```
Bias = mean(forecast - actual). Errors are absolute for the percentiles. Units are MW.
