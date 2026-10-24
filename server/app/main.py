from __future__ import annotations

import os
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .core import compute_metrics, day_points
from .store import FIRST_DAY, LAST_DAY, Store

DEFAULT_CUTOFF = "09:00"
CUTOFF_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
DAY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    state["store"] = Store()
    yield


app = FastAPI(title="Wind forecast API", version="0.1.0", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET"], allow_headers=["*"])


def _cutoff(value: str) -> str:
    if not CUTOFF_RE.match(value):
        raise HTTPException(422, "cutoff must be HH:MM (24h, UK time)")
    return value


def _day(value: str) -> str:
    if not DAY_RE.match(value):
        raise HTTPException(422, "date must be YYYY-MM-DD")
    return value


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/meta")
def meta():
    return {"firstDay": FIRST_DAY, "lastDay": LAST_DAY, "defaultCutoff": DEFAULT_CUTOFF}


@app.get("/api/forecast")
def forecast(day: str = Query(...), cutoff: str = DEFAULT_CUTOFF):
    day, cutoff = _day(day), _cutoff(cutoff)
    if not (FIRST_DAY <= day <= LAST_DAY):
        raise HTTPException(404, f"day must be between {FIRST_DAY} and {LAST_DAY}")
    points = day_points(state["store"].selection(cutoff), day)
    if not points:
        raise HTTPException(404, f"No data for {day}")
    return {"day": day, "cutoff": cutoff, "points": points}


@app.get("/api/metrics")
def metrics(cutoff: str = DEFAULT_CUTOFF, date_from: str | None = None, date_to: str | None = None):
    cutoff = _cutoff(cutoff)
    if date_from:
        _day(date_from)
    if date_to:
        _day(date_to)
    result = compute_metrics(state["store"].selection(cutoff), date_from, date_to)
    return {"cutoff": cutoff, **result}
