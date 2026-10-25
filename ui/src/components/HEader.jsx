import React from 'react';
import Logo from './Logo';
import { Clock } from 'lucide-react';

export default function Header({ currentTime }) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '18px', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Logo />
        <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.08)' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              ELEXON BMRS API
            </span>
          
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, letterSpacing: '-0.01em', color: '#F3F4F6' }}>
            UK Day-Ahead Wind Power Trading Desk
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#0B0F19', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)' }}>
          <Clock size={15} color="#3B82F6" />
          <span className="mono" style={{ color: '#F3F4F6', fontWeight: '600', letterSpacing: '0.04em' }}>{currentTime || "12:00:00 UTC"}</span>
        </div>
      </div>
    </header>
  );
}