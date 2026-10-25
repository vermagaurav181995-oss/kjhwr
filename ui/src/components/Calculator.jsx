import React from 'react';
import { DollarSign } from 'lucide-react';

export default function Calculator({ heatRateCost, setHeatRateCost, thermalHedgeCostGBP }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, #0A0E17 0%, #0D1424 100%)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '18px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <DollarSign color="#10B981" size={24} />
        </div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px', color: '#F3F4F6' }}>CCGT Thermal Backup Hedging Calculator</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Estimated re-dispatch cost required to cover P90 wind forecast shortfall for the delivery day</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>Assumed Power Price: <strong className="mono" style={{ color: '#38BDF8' }}>£{heatRateCost}/MWh</strong></label>
          <input type="range" min="40" max="250" value={heatRateCost} onChange={e => setHeatRateCost(Number(e.target.value))} style={{ width: '150px', accentColor: '#2563EB', cursor: 'pointer' }} />
        </div>
        <div style={{ textAlign: 'right', background: '#030508', padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. Daily Shortfall Hedge</div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: '700', color: '#10B981' }}>£{Number(thermalHedgeCostGBP).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}