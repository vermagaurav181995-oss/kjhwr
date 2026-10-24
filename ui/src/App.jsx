import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';

export default function App() {
  const [day, setDay] = useState("2026-01-15");
  const [cutoff, setCutoff] = useState("09:00");
  const [activeTab, setActiveTab] = useState("profile");
  const [forecastData, setForecastData] = useState(null);
  const [monthlyMetrics, setMonthlyMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTradingData();
  }, [day, cutoff]);

  const fetchTradingData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forecast?day=${day}&cutoff=${cutoff}`);
      const json = await res.json();
      setForecastData(json);

      const mRes = await fetch(`/api/metrics?cutoff=${cutoff}`);
      const mJson = await mRes.json();
      setMonthlyMetrics(mJson);
    } catch (e) {
      console.error("API connection error:", e);
    }
    setLoading(false);
  };

  const metrics = forecastData?.metrics || {};

  return (
    <div style={{ fontFamily: 'Public Sans, -apple-system, sans-serif', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '24px' }}>
      {/* Top Navigation Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #1e293b', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>ELEXON BMRS</span>
            <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em' }}>UK Day-Ahead Wind Power Trading Desk</h1>
          </div>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '13px' }}>Procurement & Renewable Forecast Quantified Error Evaluation (January 2026 Delivery)</p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', background: '#1e293b', padding: '10px 16px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Delivery Day (D)</label>
            <input type="date" value={day} min="2026-01-02" max="2026-02-01" onChange={e => setDay(e.target.value)} style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>D-1 Decision Cutoff</label>
            <select value={cutoff} onChange={e => setCutoff(e.target.value)} style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', outline: 'none' }}>
              <option value="09:00">09:00 GMT (Morning Gate)</option>
              <option value="12:00">12:00 GMT (Midday Update)</option>
              <option value="16:00">16:00 GMT (Late Afternoon)</option>
              <option value="22:00">22:00 GMT (Final D-1 Lock)</option>
            </select>
          </div>
        </div>
      </header>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <MetricCard title="Mean Absolute Error (MAE)" value={`${metrics.mae ? metrics.mae.toFixed(1) : 0} MW`} badge="Accuracy" />
        <MetricCard title="Root Mean Sq Error (RMSE)" value={`${metrics.rmse ? metrics.rmse.toFixed(1) : 0} MW`} badge="Volatility" />
        <MetricCard title="Forecast Bias" value={`${metrics.bias ? metrics.bias.toFixed(1) : 0} MW`} badge={metrics.bias > 0 ? "Overforecast" : "Underforecast"} isPositive={metrics.bias <= 0} />
        <MetricCard title="P50 Absolute Error" value={`${metrics.p50_abs_error ? metrics.p50_abs_error.toFixed(1) : 0} MW`} badge="Median Error" />
        <MetricCard title="P90 Absolute Error" value={`${metrics.p90_abs_error ? metrics.p90_abs_error.toFixed(1) : 0} MW`} badge="Tail Risk" isAlert={true} />
      </div>

      {/* Interactive Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="📈 Half-Hourly Generation Profile (Actual vs Cutoff)" />
        <TabButton active={activeTab === 'residuals'} onClick={() => setActiveTab('residuals')} label="📊 Forecast Error Residuals (MW)" />
        <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} label="📋 Monthly Accuracy Trend" />
      </div>

      {/* Main Workspace Chart / Content Card */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', height: '480px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
            <p>Querying Elexon BMRS streams for {day} at {cutoff} cutoff...</p>
          </div>
        ) : activeTab === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>National Wind Generation & Decision Forecast ({day})</h3>
              <span style={{ fontSize: '12px', color: '#38bdf8' }}>Resolution: 30-Minute Settlement Periods</span>
            </div>
            <ResponsiveContainer width="100%" height="86%">
              <LineChart data={forecastData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="startTime" tickFormatter={t => t.slice(11, 16)} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit=" MW" />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#475569', borderRadius: '8px', color: '#fff' }} labelFormatter={t => `Settlement Time: ${t.replace('T', ' ')} UTC`} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line type="monotone" dataKey="actual" stroke="#38bdf8" strokeWidth={2.5} dot={false} name="Actual Wind Outturn (MW)" />
                <Line type="monotone" dataKey="forecast" stroke="#f43f5e" strokeWidth={2.5} strokeDasharray="4 4" dot={false} name={`Cutoff Forecast @ ${cutoff} (MW)`} />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : activeTab === 'residuals' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>Forecast Error (Forecast minus Actual) per Settlement Period</h3>
              <span style={{ fontSize: '12px', color: '#f43f5e' }}>Positive = Over-procurement risk | Negative = Shortfall risk</span>
            </div>
            <ResponsiveContainer width="100%" height="86%">
              <BarChart data={forecastData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="startTime" tickFormatter={t => t.slice(11, 16)} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit=" MW" />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#475569', borderRadius: '8px', color: '#fff' }} />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Bar dataKey="error" fill="#38bdf8" name="Error (Forecast - Actual)" />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>Daily MAE Trend Across January 2026 ({cutoff} Cutoff)</h3>
              <span style={{ fontSize: '12px', color: '#38bdf8' }}>Overall MAE: {monthlyMetrics?.summary?.mae?.toFixed(1) || 0} MW</span>
            </div>
            <ResponsiveContainer width="100%" height="86%">
              <LineChart data={monthlyMetrics?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tickFormatter={d => d.slice(8, 10)} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit=" MW" />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#475569', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="mae" stroke="#10b981" strokeWidth={2} dot={true} name="Daily Mean Absolute Error (MW)" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, badge, isPositive = true, isAlert = false }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: isAlert ? '#7f1d1d' : '#0f766e', color: isAlert ? '#fca5a5' : '#5cc5b7' }}>{badge}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{ background: active ? '#3b82f6' : '#1e293b', color: active ? '#fff' : '#94a3b8', border: active ? '1px solid #3b82f6' : '1px solid #334155', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
      {label}
    </button>
  );
}