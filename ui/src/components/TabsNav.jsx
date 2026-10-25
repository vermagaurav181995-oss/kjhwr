import React from 'react';

export default function TabsNav({ activeTab, setActiveTab }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', overflowX: 'auto' }}>
      <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="📈 Generation Profile (Actual vs. Cutoff)" />
      <TabButton active={activeTab === 'residuals'} onClick={() => setActiveTab('residuals')} label="📊 Forecast Error Residuals (MW)" />
      <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} label="📋 January 2026 Accuracy Trend" />
      <TabButton active={activeTab === 'table'} onClick={() => setActiveTab('table')} label="📑 Settlement Period Data Table" />
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button 
      onClick={onClick} 
      style={{ 
        background: active ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#0A0E17', 
        color: active ? '#FFF' : '#9CA3AF', 
        border: active ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.08)', 
        padding: '10px 20px', 
        borderRadius: '8px', 
        fontSize: '13px', 
        fontWeight: '600', 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        boxShadow: active ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none'
      }}
    >
      {label}
    </button>
  );
}