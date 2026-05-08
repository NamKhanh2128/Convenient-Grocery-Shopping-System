import React from 'react';

const MealCards = ({ todayMeals }) => {
  const statusMap = {
    done: {
      label: 'Đã xong',
      bg: 'rgba(34,197,94,0.25)',
      color: '#4ade80',
      border: 'rgba(34,197,94,0.4)',
    },
    active: {
      label: 'Đang nấu',
      bg: 'rgba(245,158,11,0.25)',
      color: '#fbbf24',
      border: 'rgba(245,158,11,0.4)',
    },
    planned: {
      label: 'Kế hoạch',
      bg: 'rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.6)',
      border: 'rgba(255,255,255,0.15)',
    },
  };

  return (
    <div style={{
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '20px',
      padding: '28px',
      background: 'rgba(217, 217, 217, 0.24)',
      // backdropFilter: 'blur(24px)',
      // WebkitBackdropFilter: 'blur(24px)',
      willChange: 'transform',
      transform: 'translateZ(0)',
      contain: 'layout paint', 
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '20px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Glow decorator */}
      <div style={{
        position: 'absolute', top: '-60px', right: '20%',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'rgba(139,92,246,0.12)',
        filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
        willChange: 'transform',    
        transform: 'translateZ(0)',
      }}/>

      {/* Header */}
      <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.45)',
          fontWeight: 600,
        }}>
          Meal Plan
        </div>
        <h3 style={{
          margin: '4px 0 0 0',
          fontSize: '22px',
          fontWeight: 700,
          color: '#ffffff',
        }}>
          Thực đơn hôm nay
        </h3>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        position: 'relative',
        zIndex: 1,
      }}>
        {todayMeals.map((m, i) => {
          const s = statusMap[m.status] || statusMap.planned;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(217,217,217,0.3)',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.background = 'rgba(217, 217, 217, 0.5)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.background = 'rgba(217,217,217,0.3)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
            >
              {/* Image */}
              <div style={{
                position: 'relative',
                height: '200px',
                flexShrink: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                overflow: 'hidden',
              }}>
                <img
                  src={m.image}
                  alt={m.dish}
                  onError={e => { e.target.style.display = 'none'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Slot Badge */}
                <div style={{
                  position: 'absolute', top: '12px', left: '12px',
                  fontSize: '12px', fontWeight: 700,
                  padding: '6px 12px', borderRadius: '999px',
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  {m.slot}
                </div>

                {/* Status Badge */}
                <div style={{
                  position: 'absolute', bottom: '12px', right: '12px',
                  background: s.bg,
                  color: s.color,
                  border: `1px solid ${s.border}`,
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                }}>
                  {s.label}
                </div>
              </div>

              {/* Content */}
              <div style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: '12px',
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.4,
                }}>
                  {m.dish}
                </h4>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '4px',
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 500,
                  }}>
                    <i className="fa-regular fa-user" style={{ fontSize: '12px' }}></i> {m.note}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: m.time ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                  }}>
                    <i className="fa-regular fa-clock" style={{ fontSize: '12px' }}></i> {m.time || '--:--'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add meal button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '16px',
            border: '2px dashed rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.04)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            gap: '12px',
            minHeight: '300px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', color: 'rgba(255,255,255,0.6)',
          }}>
            ＋
          </div>
          <span style={{
            fontWeight: 600, fontSize: '15px',
            color: 'rgba(255,255,255,0.6)',
          }}>Thêm bữa ăn</span>
        </div>
      </div>
    </div>
  );
};

export default MealCards;