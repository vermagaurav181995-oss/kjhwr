import React from 'react';
import { Zap } from 'lucide-react';

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}>
        <Zap size={20} color="#FFFFFF" fill="#FFFFFF" />
      </div>
      <div>
        <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.02em', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
          VOLTA<span style={{ color: '#3B82F6' }}>UK</span>
        </div>
        <div style={{ fontSize: '10px', color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '600' }}>
          Wind Trading Desk
        </div>
      </div>
    </div>
  );
}