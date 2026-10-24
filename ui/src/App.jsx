import React, { useState, useEffect } from 'react';
import { fetchApi } from './utils/api';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine 
} from 'recharts';
import { Activity, ShieldAlert, Zap, Download, RefreshCw, DollarSign, TrendingUp, Clock, Server } from 'lucide-react';

export default function App() {
  const [day, setDay] = useState("2026-01-15");
  const [cutoff, setCutoff] = useState("09:00");
  const [heatRateCost, setHeatRateCost] = useState(85);
  const [activeTab, setActiveTab] = useState("profile");
  const [forecastData, setForecastData] = useState(null);
  const [monthlyMetrics, setMonthlyMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Live UTC Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, [day, cutoff]);

  const loadData = async () => {
    setLoading(true);
    try {
      const fData = await fetchApi(`/api/forecast?day=${day}&cutoff=${cutoff}`);
      setForecastData(fData);

      const mData = await fetchApi(`/api/metrics?cutoff=${cutoff}`);
      setMonthlyMetrics(mData);
    } catch (err) {
      console.error("Failed to load forecast desk data", err);
    }
    setLoading(false);
  };

  const metrics = forecastData?.metrics || {};
  const dataList = forecastData?.data || [];

  // Thermal Backup Calculation
  const p90ErrorMW = metrics.p90_abs_error || 0;
  const thermalHedgeCostGBP = (p90ErrorMW * 0.5 * heatRateCost).toFixed(0);

  const exportCSV = () => {
    if (!dataList.length) return;
    const headers = ["SettlementPeriod,StartTime,Actual_MW,Forecast_MW,Error_MW\n"];
    const rows = dataList.map(r => `${r.sp},${r.startTime},${r.actual},${r.forecast},${r.error}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Wind_Forecast_Evaluation_${day}_Cutoff_${cutoff.replace(':','')}.csv`;
    a.click();
  };

  const filteredData = dataList.filter(item => 
    item.startTime.includes(searchFilter) || item.sp.toString() === searchFilter
  );

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px', background: '#05070B', color: '#F3F4F6' }}>
      
      {/* Top Institutional Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #111827', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: '#FFF', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em' }}>
              ELEXON BMRS API
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} className="spin"></span> Live Feed
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '-0.01em' }}>UK Day-Ahead Wind Power Trading Desk</h1>
          <p style={{ color: '#9CA3AF', margin: '2px 0 0 0', fontSize: '13px' }}>
            Renewable Generation Actuals (<code style={{color: '#60A5FA'}}>FUELHH</code>) vs. D-1 Cutoff Forecasts (<code style={{color: '#60A5FA'}}>WINDFOR</code>) — Jan 2026 Delivery
          </p>
        </div>

        {/* Live Clock & Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#0B0F17', border: '1px solid #1F2937', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9CA3AF' }}>
            <Clock size={15} color="#3B82F6" />
            <span className="mono" style={{ color: '#F3F4F6', fontWeight: '600' }}>{currentTime || "12:00:00 UTC"}</span>
          </div>
        </div>
      </header>

      {/* Control Toolbar Card */}
      <div style={{ background: '#0B0F17', border: '1px solid #1F2937', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: '#9CA3AF', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>DELIVERY DAY (D)</label>
            <input 
              type="date" 
              value={day} 
              min="2026-01-02" 
              max="2026-02-01" 
              onChange={e => setDay(e.target.value)} 
              style={{ background: '#111827', color: '#FFF', border: '1px solid #374151', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none', colorScheme: 'dark' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: '#9CA3AF', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>D-1 DECISION GATE CUTOFF</label>
            <select 
              value={cutoff} 
              onChange={e => setCutoff(e.target.value)} 
              style={{ background: '#111827', color: '#FFF', border: '1px solid #374151', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
            >
              <option value="09:00">09:00 GMT (Morning Gate)</option>
              <option value="12:00">12:00 GMT (Midday Update)</option>
              <option value="16:00">16:00 GMT (Late Afternoon)</option>
              <option value="22:00">22:00 GMT (Final D-1 Lock)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={loadData} 
            style={{ background: '#1F2937', color: '#FFF', border: '1px solid #374151', borderRadius: '6px', padding: '0 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', height: '38px', fontWeight: '500', fontSize: '13px', transition: 'background 0.2s' }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Sync Datasets
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <MetricCard title="MAE (Mean Abs Error)" value={`${metrics.mae ? metrics.mae.toFixed(1) : 0} MW`} badge="Accuracy Benchmark" icon={<Activity size={16} color="#3B82F6"/>} />
        <MetricCard title="RMSE (Volatility)" value={`${metrics.rmse ? metrics.rmse.toFixed(1) : 0} MW`} badge="Error Spread" icon={<Zap size={16} color="#F59E0B"/>} />
        <MetricCard title="Forecast Bias" value={`${metrics.bias ? metrics.bias.toFixed(1) : 0} MW`} badge={metrics.bias > 0 ? "+ Overforecast Risk" : "- Shortfall Risk"} isAlert={metrics.bias > 300} />
        <MetricCard title="P50 Abs Error" value={`${metrics.p50_abs_error ? metrics.p50_abs_error.toFixed(1) : 0} MW`} badge="Median Error" />
        <MetricCard title="P90 Tail Risk Error" value={`${p90ErrorMW.toFixed(1)} MW`} badge="P90 Shortfall Buffer" isAlert={true} icon={<ShieldAlert size={16} color="#EF4444"/>} />
      </div>

      {/* Thermal Backup Hedge Calculator Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0B0F17 0%, #111827 100%)', border: '1px solid #1F2937', borderRadius: '10px', padding: '18px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <DollarSign color="#10B981" size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px', color: '#F3F4F6' }}>CCGT Thermal Backup Hedging Calculator</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Estimated re-dispatch cost to cover P90 wind forecast shortfall for the delivery day</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Assumed Power Price: <strong className="mono" style={{ color: '#38BDF8' }}>£{heatRateCost}/MWh</strong></label>
            <input type="range" min="40" max="250" value={heatRateCost} onChange={e => setHeatRateCost(Number(e.target.value))} style={{ width: '150px', accentColor: '#2563EB', cursor: 'pointer' }} />
          </div>
          <div style={{ textAlign: 'right', background: '#05070B', padding: '8px 16px', borderRadius: '6px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Daily Shortfall Hedge</div>
            <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: '#10B981' }}>£{Number(thermalHedgeCostGBP).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #1F2937', paddingBottom: '12px', overflowX: 'auto' }}>
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="📈 Generation Profile (Actual vs. Cutoff)" />
        <TabButton active={activeTab === 'residuals'} onClick={() => setActiveTab('residuals')} label="📊 Forecast Error Residuals (MW)" />
        <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} label="📋 January 2026 Accuracy Trend" />
        <TabButton active={activeTab === 'table'} onClick={() => setActiveTab('table')} label="📑 Settlement Period Data Table" />
      </div>

      {/* Main Workspace Panel */}
      <div style={{ background: '#0B0F17', border: '1px solid #1F2937', borderRadius: '10px', padding: '24px', minHeight: '460px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '380px', color: '#9CA3AF', gap: '12px' }}>
            <RefreshCw size={28} className="spin" style={{ color: '#3B82F6' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Querying Elexon BMRS streams for {day} at {cutoff} cutoff...</p>
          </div>
        ) : activeTab === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#F3F4F6' }}>National Wind Generation Outturn vs. Cutoff Decision Forecast</h3>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Delivery Day: {day} | Cutoff Applied: {cutoff} GMT (Day D-1)</span>
              </div>
              <span style={{ fontSize: '11px', background: '#1F2937', color: '#60A5FA', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }} className="mono">
                30-Min Resolution (SP 1 - 48)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={390}>
              <LineChart data={dataList}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161E2E" />
                <XAxis dataKey="startTime" tickFormatter={t => t.slice(11, 16)} stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6B7280" unit=" MW" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0B0F17', borderColor: '#374151', borderRadius: '8px', color: '#FFF' }} labelFormatter={t => `Time: ${t.replace('T', ' ')} UTC`} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }} />
                <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Actual Wind Outturn (MW)" />
                <Line type="monotone" dataKey="forecast" stroke="#EF4444" strokeWidth={2.5} strokeDasharray="4 4" dot={false} name={`Cutoff Forecast @ ${cutoff} (MW)`} />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : activeTab === 'residuals' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#F3F4F6' }}>Half-Hourly Forecast Error Residuals (Forecast minus Actual)</h3>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Positive values indicate over-procurement risk; negative values indicate shortfall risk</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={390}>
              <BarChart data={dataList}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161E2E" />
                <XAxis dataKey="startTime" tickFormatter={t => t.slice(11, 16)} stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6B7280" unit=" MW" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0B0F17', borderColor: '#374151', borderRadius: '8px', color: '#FFF' }} />
                <ReferenceLine y={0} stroke="#9CA3AF" />
                <Bar dataKey="error" fill="#3B82F6" name="Error Delta (MW)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : activeTab === 'summary' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#F3F4F6' }}>Daily MAE Trend Across January 2026 ({cutoff} Cutoff)</h3>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Month-to-date aggregate performance tracking</span>
              </div>
              <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }} className="mono">
                Overall MAE: {monthlyMetrics?.summary?.mae?.toFixed(1) || 0} MW
              </span>
            </div>
            <ResponsiveContainer width="100%" height={390}>
              <LineChart data={monthlyMetrics?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161E2E" />
                <XAxis dataKey="day" tickFormatter={d => d.slice(8, 10)} stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6B7280" unit=" MW" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0B0F17', borderColor: '#374151', borderRadius: '8px', color: '#FFF' }} />
                <Line type="monotone" dataKey="mae" stroke="#10B981" strokeWidth={2.5} dot={true} name="Daily Mean Absolute Error (MW)" />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Filter by Settlement Period (e.g. 1, 14) or Time..." 
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{ background: '#111827', color: '#FFF', border: '1px solid #374151', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', width: '320px', outline: 'none' }}
              />
              <button onClick={exportCSV} style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', transition: 'background 0.2s' }}>
                <Download size={15} /> Export CSV Report
              </button>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '360px', border: '1px solid #1F2937', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#111827', color: '#9CA3AF', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>SP</th>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>Start Time (UTC)</th>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>Actual Wind (MW)</th>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>Forecast Wind (MW)</th>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>Error Delta (MW)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => (
                    <tr key={row.sp} style={{ borderBottom: '1px solid #1F2937', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#111827'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px' }} className="mono">{row.sp}</td>
                      <td style={{ padding: '10px 14px' }} className="mono">{row.startTime.replace('T', ' ')}</td>
                      <td style={{ padding: '10px 14px', color: '#3B82F6', fontWeight: '500' }} className="mono">{row.actual.toFixed(1)}</td>
                      <td style={{ padding: '10px 14px', color: '#EF4444', fontWeight: '500' }} className="mono">{row.forecast.toFixed(1)}</td>
                      <td style={{ padding: '10px 14px', color: row.error > 0 ? '#F59E0B' : '#10B981', fontWeight: '600' }} className="mono">
                        {row.error > 0 ? `+${row.error.toFixed(1)}` : row.error.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, badge, isAlert = false, icon }) {
  return (
    <div style={{ background: '#0B0F17', border: '1px solid #1F2937', borderRadius: '10px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
        {icon}
      </div>
      <div className="mono" style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', color: '#F3F4F6', letterSpacing: '-0.02em' }}>{value}</div>
      <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', background: isAlert ? 'rgba(127, 29, 29, 0.4)' : 'rgba(6, 95, 70, 0.4)', color: isAlert ? '#FCA5A5' : '#6EE7B7', border: isAlert ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)' }}>
        {badge}
      </span>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button 
      onClick={onClick} 
      style={{ 
        background: active ? '#2563EB' : '#0B0F17', 
        color: active ? '#FFF' : '#9CA3AF', 
        border: active ? '1px solid #2563EB' : '1px solid #1F2937', 
        padding: '9px 18px', 
        borderRadius: '6px', 
        fontSize: '13px', 
        fontWeight: '600', 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </button>
  );
}