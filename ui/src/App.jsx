import React, { useState, useEffect } from 'react';
import { fetchApi } from './utils/api';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine 
} from 'recharts';
import { Download, RefreshCw } from 'lucide-react';

import Header from './components/HEader';
import MetricsGrid from './components/MetricsGrid';
import Calculator from './components/Calculator';
import TabsNav from './components/TabsNav';

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
    <div style={{ minHeight: '100vh', padding: '28px 36px', background: '#030508', color: '#F3F4F6' }}>
      <Header currentTime={currentTime} />

      {/* Control Toolbar Card */}
      <div style={{ background: 'linear-gradient(145deg, #0A0E17 0%, #060911 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: '#9CA3AF', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>DELIVERY DAY (D)</label>
            <input 
              type="date" 
              value={day} 
              min="2026-01-02" 
              max="2026-02-01" 
              onChange={e => setDay(e.target.value)} 
              style={{ background: '#111827', color: '#FFF', border: '1px solid #374151', padding: '9px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', colorScheme: 'dark', fontWeight: '500' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: '#9CA3AF', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>D-1 DECISION GATE CUTOFF</label>
            <select 
              value={cutoff} 
              onChange={e => setCutoff(e.target.value)} 
              style={{ background: '#111827', color: '#FFF', border: '1px solid #374151', padding: '9px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', fontWeight: '500' }}
            >
              <option value="09:00">09:00 GMT (Morning Gate)</option>
              <option value="12:00">12:00 GMT (Midday Update)</option>
              <option value="16:00">16:00 GMT (Late Afternoon)</option>
              <option value="22:00">22:00 GMT (Final D-1 Lock)</option>
            </select>
          </div>
        </div>

        <div>
          <button 
            onClick={loadData} 
            style={{ background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', height: '40px', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} color="#60A5FA" /> Sync Datasets
          </button>
        </div>
      </div>

      <MetricsGrid metrics={metrics} />
      <Calculator heatRateCost={heatRateCost} setHeatRateCost={setHeatRateCost} thermalHedgeCostGBP={thermalHedgeCostGBP} />
      <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Panel */}
      <div style={{ background: '#0A0E17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '26px', minHeight: '480px', boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.6)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', color: '#9CA3AF', gap: '14px' }}>
            <RefreshCw size={32} className="spin" style={{ color: '#3B82F6' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Querying Elexon BMRS data streams for {day} at {cutoff} cutoff...</p>
          </div>
        ) : activeTab === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#F3F4F6' }}>National Wind Generation Outturn vs. Cutoff Decision Forecast</h3>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Delivery Day: {day} | Cutoff Applied: {cutoff} GMT (Day D-1)</span>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', padding: '5px 12px', borderRadius: '6px', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.2)' }} className="mono">
                30-Min Resolution (SP 1 - 48)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dataList}>
                <CartesianGrid strokeDasharray="3 3" stroke="#131B2E" />
                <XAxis dataKey="startTime" tickFormatter={t => t.slice(11, 16)} stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6B7280" unit=" MW" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0A0E17', borderColor: '#374151', borderRadius: '8px', color: '#FFF', boxShadow: '0 8px 20px rgba(0,0,0,0.6)' }} labelFormatter={t => `Time: ${t.replace('T', ' ')} UTC`} />
                <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '13px' }} />
                <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Actual Wind Outturn (MW)" />
                <Line type="monotone" dataKey="forecast" stroke="#EF4444" strokeWidth={2.5} strokeDasharray="4 4" dot={false} name={`Cutoff Forecast @ ${cutoff} (MW)`} />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : activeTab === 'residuals' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#F3F4F6' }}>Half-Hourly Forecast Error Residuals (Forecast minus Actual)</h3>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Positive values indicate over-procurement risk; negative values indicate shortfall risk</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dataList}>
                <CartesianGrid strokeDasharray="3 3" stroke="#131B2E" />
                <XAxis dataKey="startTime" tickFormatter={t => t.slice(11, 16)} stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6B7280" unit=" MW" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0A0E17', borderColor: '#374151', borderRadius: '8px', color: '#FFF', boxShadow: '0 8px 20px rgba(0,0,0,0.6)' }} />
                <ReferenceLine y={0} stroke="#9CA3AF" />
                <Bar dataKey="error" fill="#3B82F6" name="Error Delta (MW)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : activeTab === 'summary' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#F3F4F6' }}>Daily MAE Trend Across January 2026 ({cutoff} Cutoff)</h3>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Month-to-date aggregate performance tracking</span>
              </div>
              <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600', background: 'rgba(16, 185, 129, 0.1)', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }} className="mono">
                Overall MAE: {monthlyMetrics?.summary?.mae?.toFixed(1) || 0} MW
              </span>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyMetrics?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#131B2E" />
                <XAxis dataKey="day" tickFormatter={d => d.slice(8, 10)} stroke="#6B7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6B7280" unit=" MW" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0A0E17', borderColor: '#374151', borderRadius: '8px', color: '#FFF', boxShadow: '0 8px 20px rgba(0,0,0,0.6)' }} />
                <Line type="monotone" dataKey="mae" stroke="#10B981" strokeWidth={2.5} dot={true} name="Daily Mean Absolute Error (MW)" />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Filter by Settlement Period (e.g. 1, 14) or Time..." 
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{ background: '#111827', color: '#FFF', border: '1px solid #374151', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', width: '320px', outline: 'none' }}
              />
              <button onClick={exportCSV} style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                <Download size={15} /> Export CSV Report
              </button>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '380px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#111827', color: '#9CA3AF', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>SP</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Start Time (UTC)</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Actual Wind (MW)</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Forecast Wind (MW)</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Error Delta (MW)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => (
                    <tr key={row.sp} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#111827'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 16px' }} className="mono">{row.sp}</td>
                      <td style={{ padding: '11px 16px' }} className="mono">{row.startTime.replace('T', ' ')}</td>
                      <td style={{ padding: '11px 16px', color: '#3B82F6', fontWeight: '500' }} className="mono">{row.actual.toFixed(1)}</td>
                      <td style={{ padding: '11px 16px', color: '#EF4444', fontWeight: '500' }} className="mono">{row.forecast.toFixed(1)}</td>
                      <td style={{ padding: '11px 16px', color: row.error > 0 ? '#F59E0B' : '#10B981', fontWeight: '600' }} className="mono">
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