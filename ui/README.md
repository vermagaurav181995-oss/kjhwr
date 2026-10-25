# UK Day-Ahead Wind Power Trading Desk

An institutional-grade, full-stack analytics platform designed for UK wholesale electricity traders to evaluate Elexon BMRS renewable wind generation forecasts (`WINDFOR`) against actual outturn data (`FUELHH`) for January 2026 delivery optimization and imbalance risk management.

---

## 🏗️ Architecture & Project Structure

The project is structured with a decoupled backend and frontend architecture:

```text
kjhwr/
├── server/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── core.py           # Cutoff selection & quantitative error metrics
│   │   ├── store.py          # Data store caching & CSV loader
│   │   └── main.py           # FastAPI REST endpoints
│   ├── scripts/
│   │   └── fetch_elexon.py   # Elexon BMRS API / synthetic data generator
│   ├── tests/
│   │   └── test_core.py      # Pytest unit tests for forecast logic
│   └── requirements.txt
│
└── ui/                       # React + Vite Frontend
    ├── src/
    │   ├── components/       # Modular UI components (Header, MetricsGrid, Calculator, TabsNav)
    │   ├── utils/            # API fetch utility wrapper
    │   ├── App.jsx           # Main dashboard workspace
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── index.html