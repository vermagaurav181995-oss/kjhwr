import { useEffect, useMemo, useState } from "react";
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { getForecast, getMetrics } from "./api.js";

const COLORS = { actual: "#0b3c5d", forecast: "#d9822b", band: "#2a9d8f" };
const fmt = (n) => Math.round(n).toLocaleString("en-GB");

export default function App() {
  // Decisions are made in January, so delivery days run 2 Jan to 1 Feb.
  const [day, setDay] = useState("2026-01-15");
  const [cutoff, setCutoff] = useState("09:00");
  const [forecast, setForecast] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [mock, setMock] = useState(false);
  const [tab, setTab] = useState("hour");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    Promise.all([getForecast(day, cutoff), getMetrics(cutoff)]).then(([f, m]) => {
      if (!live) return;
      setForecast(f.data);
      setMetrics(m.data);
      setMock(f.mock || m.mock);
      setLoading(false);
    });
    return () => { live = false; };
  }, [day, cutoff]);

  const p90 = metrics?.summary.p90 ?? 0;
  const points = useMemo(
    () =>
      (forecast?.points ?? []).map((p) => ({
        ...p,
        band: [Math.max(0, p.forecast - p90), p.forecast + p90],
      })),
    [forecast, p90]
  );

  const dayStats = useMemo(() => {
    if (!points.length) return null;
    const avg = (k) => points.reduce((s, p) => s + p[k], 0) / points.length;
    return { forecastAvg: avg("forecast"), actualAvg: avg("actual") };
  }, [points]);

  return (
    <div className="page">
      <header className="top">
        <div>
          <h1>Wind forecast desk</h1>
          <p className="sub">
            GB national wind generation: what the forecast said when you had to buy, and how far off it tends to be.
          </p>
        </div>
        <div className="controls">
          <label>
            Delivery day
            <input type="date" value={day} min="2026-01-02" max="2026-02-01" onChange={(e) => e.target.value && setDay(e.target.value)} />
          </label>
          <label>
            Decision time, day before (UK)
            <input type="time" value={cutoff} onChange={(e) => e.target.value && setCutoff(e.target.value)} />
          </label>
        </div>
      </header>

      {mock && (
        <p className="notice" role="status">
          Backend not reachable, showing sample data. Start the FastAPI server to see real Elexon figures.
        </p>
      )}

      <main aria-busy={loading}>
        <section className="hero">
          <div className="hero-head">
            <h2>
              Expected wind on {new Date(day + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            {dayStats && (
              <p className="hero-num">
                <strong>{fmt(dayStats.forecastAvg)} MW</strong> average forecast
                <span className="muted"> · outturn {fmt(dayStats.actualAvg)} MW</span>
              </p>
            )}
          </div>
          <div className="chart tall">
            <ResponsiveContainer>
              <ComposedChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#dfe6ea" vertical={false} />
                <XAxis dataKey="time" interval={5} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={fmt} width={64} tick={{ fontSize: 12 }} label={{ value: "MW", angle: -90, position: "insideLeft", offset: 14, fontSize: 12 }} />
                <Tooltip formatter={(v) => (Array.isArray(v) ? `${fmt(v[0])} to ${fmt(v[1])} MW` : `${fmt(v)} MW`)} />
                <Legend />
                <Area dataKey="band" name="Forecast ± typical high error (P90)" stroke="none" fill={COLORS.band} fillOpacity={0.18} />
                <Line dataKey="forecast" name="Forecast at decision time" stroke={COLORS.forecast} strokeWidth={2.5} dot={false} />
                <Line dataKey="actual" name="Actual" stroke={COLORS.actual} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="note">
            The shaded band shows the range that contains the actual outturn about 9 times in 10, based on all January forecasts at this decision time.
          </p>
        </section>

        <section className="stats" aria-label="Forecast accuracy, January 2026">
          <h2>How accurate was it?</h2>
          {metrics && (
            <dl>
              <Stat label="Average miss (MAE)" value={`${fmt(metrics.summary.mae)} MW`} hint="Typical size of an error" />
              <Stat label="RMSE" value={`${fmt(metrics.summary.rmse)} MW`} hint="Penalises large misses more" />
              <Stat label="Bias" value={`${metrics.summary.bias > 0 ? "+" : ""}${fmt(metrics.summary.bias)} MW`} hint={metrics.summary.bias < 0 ? "Forecast runs low on average" : "Forecast runs high on average"} />
              <Stat label="Error, 9 in 10 half-hours" value={`${fmt(metrics.summary.p90)} MW`} hint="Plan a buffer of this size" />
              <Stat label="Error, 19 in 20 half-hours" value={`${fmt(metrics.summary.p95)} MW`} hint="For a more cautious buffer" />
            </dl>
          )}
        </section>

        <section className="breakdown">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === "hour"} onClick={() => setTab("hour")}>Error by time of day</button>
            <button role="tab" aria-selected={tab === "horizon"} onClick={() => setTab("horizon")}>Error by forecast age</button>
          </div>
          <div className="chart">
            <ResponsiveContainer>
              {tab === "hour" ? (
                <BarChart data={metrics?.byHour ?? []} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#dfe6ea" vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${String(h).padStart(2, "0")}:00`} interval={2} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmt} width={64} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${fmt(v)} MW`} labelFormatter={(h) => `Target hour ${String(h).padStart(2, "0")}:00`} />
                  <Bar dataKey="mae" name="Average miss" fill={COLORS.actual} radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={metrics?.byHorizon ?? []} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#dfe6ea" vertical={false} />
                  <XAxis dataKey="horizon" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmt} width={64} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${fmt(v)} MW`} labelFormatter={(h) => `Published ${h} hours before delivery`} />
                  <Line dataKey="mae" name="Average miss" stroke={COLORS.actual} strokeWidth={2.5} dot />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
      <p>{hint}</p>
    </div>
  );
}
