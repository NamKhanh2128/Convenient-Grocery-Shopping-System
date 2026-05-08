import React from 'react';
import { Link } from 'react-router-dom';

const DashboardHeader = ({ user, activeNav, setActiveNav, navItems }) => {
  return (
    <nav style={{
      background: '#111111',
      padding: '0 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '80px',
      boxShadow: '0 4px 30px rgba(0,0,0,0.15)',
      position: 'sticky', top: 0, zIndex: 100,
      borderBottom: '1px solid #1e1f26',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          color: '#ffffff', fontFamily: "'Nunito', sans-serif",
          fontWeight: 900, fontSize: '28px', textDecoration: 'none',
        }}>
          <div style={{
            width: '48px', height: '48px', background: '#f59e0b',
            borderRadius: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(245,166,35,0.4)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M6 12h12M12 6v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          NATEAT
        </Link>

        <div style={{ display: 'flex', gap: '4px' }}>
          {navItems.map(item => {
            const active = activeNav === item.id;
            return (
              <div key={item.id} onClick={() => setActiveNav(item.id)} style={{
                padding: '12px 22px', borderRadius: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '17px', fontWeight: 600,
                background: active ? '#1e1f26' : 'transparent',
                color: active ? '#ffffff' : '#9ca3af',
                borderBottom: active ? '3px solid #f59e0b' : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                {item.icon}
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '14px',
            background: '#1e1f26',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            border: '1px solid #2a2b32',
          }}>🔔</div>
          <div style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '22px', height: '22px', background: '#E74C3C', borderRadius: '50%',
            fontSize: '11px', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
          }}>3</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #FFD166)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            boxShadow: '0 4px 15px rgba(245,166,35,0.3)',
          }}>👤</div>
          <div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '15px', color: '#ffffff' }}>{user.name}</div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>Thành viên</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardHeader;
