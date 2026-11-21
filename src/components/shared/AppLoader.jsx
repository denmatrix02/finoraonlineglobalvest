import React from 'react';
import logo from '../../assets/logo-30_3x.png';

export default function AppLoader({ message = 'Loading your account…' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '32px',
    }}>
      {/* Logo mark */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #1a1a1a, #222)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(201,168,76,0.2), 0 0 40px rgba(201,168,76,0.15)',
          animation: 'pulse 2s ease-in-out infinite',
          padding: '10px',
        }}>
          <img
            src={logo}
            alt="Finora"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            fontSize: '22px', color: '#F4F4F5', letterSpacing: '0.05em',
            margin: 0,
          }}>FINORA</p>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 400,
            fontSize: '11px', color: '#6EE7B7', letterSpacing: '0.2em',
            textTransform: 'uppercase', margin: '2px 0 0',
          }}>Digital Banking</p>
        </div>
      </div>

      {/* Spinner */}
      <div style={{ position: 'relative', width: '48px', height: '48px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid rgba(201,168,76,0.15)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#C9A84C',
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>

      {/* Status message */}
      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: '13px',
        color: 'rgba(244,244,245,0.45)', letterSpacing: '0.02em',
        margin: 0, animation: 'fadeIn 0.5s ease',
      }}>
        {message}
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(201,168,76,0.2), 0 0 40px rgba(201,168,76,0.15); }
          50% { box-shadow: 0 0 0 1px rgba(201,168,76,0.35), 0 0 60px rgba(201,168,76,0.3); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
