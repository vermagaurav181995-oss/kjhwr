# UK Day-Ahead Wind Power Trading Desk

An institutional-grade, full-stack analytics platform designed for UK wholesale electricity traders to evaluate Elexon BMRS renewable wind generation forecasts (`WINDFOR`) against actual outturn data (`FUELHH`) for January 2026 delivery optimization and imbalance risk management.

---

## 📁 Details of Files and Directories Present

```text
kjhwr/
├── server/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── core.py           # Cutoff selection & quantitative error metrics (MAE, RMSE, Bias, Quantiles)
│   │   ├── store.py          # Data store caching & CSV dataset loader
│   │   └── main.py           # FastAPI REST endpoints (/api/health, /api/forecast, /api/metrics)
│   ├── scripts/
│   │   └── fetch_elexon.py   # Elexon BMRS API client & offline synthetic January 2026 generator
│   ├── tests/
│   │   └── test_core.py      # Pytest unit tests for forecast selection & error logic
│   └── requirements.txt      # Python dependencies (FastAPI, Uvicorn, Pandas, NumPy, Pytest)
│
└── ui/                       # React + Vite Frontend
    ├── src/
    │   ├── components/
    │   │   ├── Calculator.jsx  # CCGT thermal backup hedging financial exposure calculator
    │   │   ├── Header.jsx      # Institutional header with live UTC clock & status pill
    │   │   ├── Logo.jsx        # VoltaUK energy brand logo component
    │   │   ├── MetricsGrid.jsx # High-density KPI cards for MAE, RMSE, Bias, P50, and P90 tail risk
    │   │   └── TabsNav.jsx     # Workspace view selector tabs
    │   ├── utils/
    │   │   └── api.js          # Environment-aware API fetch wrapper
    │   ├── App.jsx             # Main dashboard controller & visualization orchestrator
    │   ├── main.jsx            # React root mount entry
    │   └── index.css           # Global custom styles, scrollbars, and animations
    ├── package.json            # Node dependencies (React, Recharts, Lucide-react)
    ├── vite.config.js          # Vite build config with local proxy support
    └── index.html              # HTML shell with Google Fonts (Inter & JetBrains Mono)