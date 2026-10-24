import { mockForecast, mockMetrics } from "./mock.js";

const BASE = import.meta.env.VITE_API_URL || "";

async function get(path, params) {
  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Each call returns { data, mock }. If the backend is unreachable we fall back
// to mock data and say so in the UI, so a demo never shows a blank screen.
export async function getForecast(day, cutoff) {
  try {
    return { data: await get("/api/forecast", { day, cutoff }), mock: false };
  } catch {
    return { data: mockForecast(day, cutoff), mock: true };
  }
}

export async function getMetrics(cutoff) {
  try {
    return { data: await get("/api/metrics", { cutoff }), mock: false };
  } catch {
    return { data: mockMetrics(cutoff), mock: true };
  }
}
