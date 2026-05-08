import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/global.css';

const colors = {
  bg: '#111318',
  surface: '#171a21',
  card: '#ffffff',
  muted: '#6b7280',
  text: '#111827',
  border: '#e5e7eb',
  accent: '#f59e0b',
  accentSoft: 'rgba(245,158,11,0.12)',
};

const sidebarIcons = [
  {
    active: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="7"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.84 4.61C19.78 3.55 18.35 2.95 16.85 2.95C15.35 2.95 13.91 3.55 12.85 4.61L12 5.46L11.15 4.61C8.94 2.4 5.36 2.4 3.15 4.61C0.94 6.82 0.94 10.4 3.15 12.61L12 21.46L20.84 12.61C23.05 10.4 23.05 6.82 20.84 4.61Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
];

const categories = [
  { emoji: '🍽️', name: 'Tất cả', count: 138, active: true },
  { emoji: '🍕', name: 'Pizza', count: 12 },
  { emoji: '🍔', name: 'Burger', count: 16 },
  { emoji: '🍝', name: 'Pasta', count: 10 },
  { emoji: '🍣', name: 'Sushi', count: 9 },
];

const recommendations = [
  {
    emoji: '🥗',
    name: 'Salad rau tươi',
    rating: 4.9,
    price: '$6.59',
  },
  {
    emoji: '🐟',
    name: 'Cá hấp rau củ',
    rating: 4.8,
    price: '$8.29',
  },
  {
    emoji: '🍓',
    name: 'Tráng miệng dâu',
    rating: 4.7,
    price: '$4.10',
  },
];

const LandingPage = () => {
  const [email, setEmail] = useState('');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        padding: '32px',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: 'fixed',
          top: '-120px',
          right: '-120px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'rgba(245,158,11,0.08)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'fixed',
          bottom: '-180px',
          left: '-100px',
          width: '460px',
          height: '460px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          background: '#f8fafc',
          borderRadius: '32px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '82px 1fr 340px',
          minHeight: '92vh',
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* SIDEBAR */}
        <aside
          style={{
            background: '#0f1115',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRight: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
            }}
          >
            🍽️
          </div>

          <div
            style={{
              color: '#9ca3af',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              marginBottom: '30px',
            }}
          >
            NATEAT
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {sidebarIcons.map((item, index) => (
              <div
                key={index}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: item.active
                    ? 'rgba(255,255,255,0.08)'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.active ? colors.accent : '#9ca3af',
                  cursor: 'pointer',
                  transition: '0.2s',
                }}
              >
                {item.icon}
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />
        </aside>

        {/* MAIN */}
        <main
          style={{
            padding: '32px',
            overflowY: 'auto',
          }}
        >
          {/* Top */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                placeholder="Tìm món ăn, nguyên liệu..."
                style={{
                  width: '100%',
                  height: '54px',
                  borderRadius: '16px',
                  border: `1px solid ${colors.border}`,
                  padding: '0 18px',
                  fontSize: '15px',
                  outline: 'none',
                  background: '#ffffff',
                }}
              />
            </div>

            <Link
              to="/login"
              style={{
                textDecoration: 'none',
                height: '54px',
                padding: '0 22px',
                borderRadius: '16px',
                background: colors.accent,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: '0 10px 25px rgba(245,158,11,0.25)',
              }}
            >
              Đăng nhập
            </Link>
          </div>

          {/* Hero */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '28px',
              padding: '36px',
              marginBottom: '28px',
              border: `1px solid ${colors.border}`,
              display: 'grid',
              gridTemplateColumns: '1.2fr 420px',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  background: colors.accentSoft,
                  color: colors.accent,
                  fontWeight: 700,
                  fontSize: '13px',
                  marginBottom: '18px',
                }}
              >
                SMART FOOD MANAGEMENT
              </div>

              <h1
                style={{
                  fontSize: '56px',
                  lineHeight: 1.05,
                  margin: 0,
                  fontWeight: 900,
                  color: colors.text,
                  letterSpacing: '-2px',
                }}
              >
                Quản lý thực phẩm
                <br />
                cho gia đình hiện đại
              </h1>

              <p
                style={{
                  marginTop: '18px',
                  fontSize: '17px',
                  lineHeight: 1.7,
                  color: colors.muted,
                  maxWidth: '620px',
                }}
              >
                Theo dõi tủ lạnh, gợi ý thực đơn, quản lý mua sắm
                và giảm lãng phí thực phẩm trong gia đình bạn.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  marginTop: '28px',
                }}
              >
                <button
                  style={{
                    height: '54px',
                    padding: '0 24px',
                    borderRadius: '16px',
                    border: 'none',
                    background: colors.accent,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  Bắt đầu ngay
                </button>

                <button
                  style={{
                    height: '54px',
                    padding: '0 24px',
                    borderRadius: '16px',
                    border: `1px solid ${colors.border}`,
                    background: '#fff',
                    color: colors.text,
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  Xem demo
                </button>
              </div>
            </div>

            {/* Preview card */}
            <div
              style={{
                background: '#171923',
                borderRadius: '26px',
                padding: '24px',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-60px',
                  right: '-60px',
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  background: 'rgba(245,158,11,0.18)',
                  filter: 'blur(20px)',
                }}
              />

              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    marginBottom: '10px',
                  }}
                >
                  Hôm nay
                </div>

                <div
                  style={{
                    fontSize: '30px',
                    fontWeight: 800,
                    marginBottom: '20px',
                  }}
                >
                  12 thực phẩm
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {[
                    '🥬 Rau xanh còn tươi',
                    '🥛 Sữa sắp hết hạn',
                    '🍅 Cần mua cà chua',
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: '28px' }}>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
              }}
            >
              {categories.map((cat, i) => (
                <div
                  key={i}
                  style={{
                    minWidth: '110px',
                    background: '#ffffff',
                    borderRadius: '22px',
                    padding: '18px',
                    border: cat.active
                      ? `2px solid ${colors.accent}`
                      : `1px solid ${colors.border}`,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontSize: '36px',
                      marginBottom: '10px',
                    }}
                  >
                    {cat.emoji}
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      color: colors.text,
                      marginBottom: '4px',
                    }}
                  >
                    {cat.name}
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      color: colors.muted,
                    }}
                  >
                    {cat.count} món
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '28px',
              padding: '28px',
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '22px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: colors.accent,
                    marginBottom: '6px',
                  }}
                >
                  GỢI Ý HÔM NAY
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: '28px',
                    color: colors.text,
                  }}
                >
                  Món ăn phù hợp cho bạn
                </h2>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '18px',
              }}
            >
              {recommendations.map((item, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: '22px',
                    background: '#f8fafc',
                    padding: '18px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      height: '150px',
                      borderRadius: '18px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '60px',
                      marginBottom: '16px',
                    }}
                  >
                    {item.emoji}
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '16px',
                      color: colors.text,
                      marginBottom: '8px',
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        color: colors.accent,
                        fontWeight: 800,
                      }}
                    >
                      {item.price}
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        color: colors.muted,
                      }}
                    >
                      ⭐ {item.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside
          style={{
            background: '#ffffff',
            borderLeft: `1px solid ${colors.border}`,
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '26px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: colors.accentSoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              👤
            </div>

            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: colors.text,
                }}
              >
                NATEAT User
              </div>

              <div
                style={{
                  fontSize: '13px',
                  color: colors.muted,
                }}
              >
                Free Plan
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              borderRadius: '22px',
              padding: '22px',
              border: `1px solid ${colors.border}`,
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontWeight: 800,
                marginBottom: '12px',
                color: colors.text,
              }}
            >
              Nhận cập nhật mới
            </div>

            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: colors.muted,
                marginBottom: '16px',
              }}
            >
              Nhận gợi ý thực đơn và mẹo quản lý thực phẩm.
            </p>

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                padding: '0 14px',
                marginBottom: '12px',
                outline: 'none',
              }}
            />

            <button
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: 'none',
                background: colors.accent,
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Đăng ký
            </button>
          </div>

          <div
            style={{
              background: '#171923',
              borderRadius: '24px',
              padding: '24px',
              color: '#fff',
              marginTop: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: '#9ca3af',
                marginBottom: '10px',
              }}
            >
              SMART KITCHEN
            </div>

            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                lineHeight: 1.3,
                marginBottom: '14px',
              }}
            >
              Giảm lãng phí thực phẩm mỗi ngày
            </div>

            <div
              style={{
                fontSize: '14px',
                color: '#d1d5db',
                lineHeight: 1.7,
              }}
            >
              Theo dõi hạn sử dụng, tự động gợi ý món ăn
              và quản lý mua sắm hiệu quả hơn.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LandingPage;