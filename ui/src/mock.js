// Deterministic mock data so the UI works before the FastAPI backend exists.
// Shapes match the API contract documented in README.md.

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, "0");
const dayNumber = (day) => Number(day.slice(8, 10)) + (day.startsWith("2026-02") ? 31 : 0);

export function mockForecast(day, cutoff) {
  const r = rng(dayNumber(day) * 97 + Number(cutoff.replace(":", "")));
  const base = 4000 + r() * 6000;
  const points = [];
  for (let i = 0; i < 48; i++) {
    const wave = Math.sin((i / 48) * Math.PI * 2 + dayNumber(day)) * 1800;
    const actual = Math.max(300, base + wave + (r() - 0.5) * 700);
    const forecast = Math.max(300, actual + (r() - 0.45) * 1900);
    points.push({
      time: `${pad(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`,
      actual: Math.round(actual),
      forecast: Math.round(forecast),
      publishTime: `${day}T${cutoff}:00Z`,
    });
  }
  return { day, cutoff, points };
}

export function mockMetrics(cutoff) {
  const r = rng(Number(cutoff.replace(":", "")) + 7);
  const byHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    mae: Math.round(700 + r() * 600 + hour * 15),
    bias: Math.round((r() - 0.5) * 500),
  }));
  const byHorizon = Array.from({ length: 12 }, (_, i) => ({
    horizon: 15 + i * 3,
    mae: Math.round(800 + i * 110 + r() * 150),
  }));
  return {
    cutoff,
    summary: { n: 1488, mae: 1020, rmse: 1380, bias: -140, mape: 12.4, p50: 790, p90: 2150, p95: 2640 },
    byHour,
    byHorizon,
  };
}
