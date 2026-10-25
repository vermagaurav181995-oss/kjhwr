import React from 'react';
import { Activity, Zap, ShieldAlert } from 'lucide-react';

export default function MetricsGrid({ metrics }) {
  const p90ErrorMW = metrics.p90_abs_error || 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <MetricCard title="MAE (Mean Abs Error)" value={`${metrics.mae ? metrics.mae.toFixed(1) : 0} MW`} badge="Accuracy Benchmark" icon={<Activity size={16} color="#3B82F6"/>} />
      <MetricCard title="RMSE (Volatility)" value={`${metrics.rmse ? metrics.rmse.toFixed(1) : 0} MW`} badge="Error Spread" icon={<Zap size={16} color="#F59E0B"/>} />
      <MetricCard title="Forecast Bias" value={`${metrics.bias ? metrics.bias.toFixed(1) : 0} MW`} badge={metrics.bias > 0 ? "+ Overforecast Risk" : "- Shortfall Risk"} isAlert={metrics.bias > 300} />
      <MetricCard title="P50 Abs Error" value={`${metrics.p50_abs_error ? metrics.p50_abs_error.toFixed(1) : 0} MW`} badge="Median Error" />
      <MetricCard title="P90 Tail Risk Error" value={`${p90ErrorMW.toFixed(1)} MW`} badge="P90 Shortfall Buffer" isAlert={true} icon={<ShieldAlert size={16} color="#EF4444"/>} />
    </div>
  );
}

function MetricCard({ title, value, badge, isAlert = false, icon }) {
  return (
    <div style={{ background: 'linear-gradient(145deg, #0A0E17 0%, #060911 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px', position: 'relative', overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
        {icon}
      </div>
      <div className="mono" style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: '#F3F4F6', letterSpacing: '-0.02em' }}>{value}</div>
      <span style={{ fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px', background: isAlert ? 'rgba(127, 29, 29, 0.4)' : 'rgba(6, 95, 70, 0.4)', color: isAlert ? '#FCA5A5' : '#6EE7B7', border: isAlert ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)' }}>
        {badge}
      </span>
    </div>
  );
}