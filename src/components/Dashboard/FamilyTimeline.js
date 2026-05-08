const FamilyTimeline = ({ familyActivities = [] }) => {
  return (
    <div
      style={{
        height: '100%',
        boxSizing: 'border-box',
        background: 'rgba(217,217,217,0.24)',
        borderRadius: '28px',
        padding: '28px',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.24)',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
        color: '#ffffff',
        position: 'relative',
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '-80px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'rgba(139,92,246,0.16)',
          filter: 'blur(100px)',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              borderRadius: '999px',
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.2)',
              marginBottom: '14px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#8b5cf6',
                boxShadow: '0 0 0 5px rgba(139,92,246,0.15)',
              }}
            />

            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#c4b5fd',
              }}
            >
              FAMILY FEED
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '6px',
            }}
          >
            Hoạt động gia đình
          </h3>

          <div
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.65)',
              fontWeight: 500,
            }}
          >
            Cập nhật mới nhất từ các thành viên
          </div>
        </div>

        {/* Live Status */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 12px rgba(34,197,94,0.8)',
            }}
          />

          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Live
          </span>
        </div>
      </div>

      {/* Feed */}
      <div
        style={{
          position: 'relative',
          paddingLeft: '8px',
          zIndex: 1,
        }}
      >
        {/* Timeline Line */}
        <div
          style={{
            position: 'absolute',
            left: '30px',
            top: '10px',
            bottom: '10px',
            width: '2px',
            borderRadius: '999px',
            background:
              'linear-gradient(to bottom, rgba(139,92,246,0.5), rgba(255,255,255,0.05))',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {familyActivities.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: `2px solid ${a.color || '#8b5cf6'}`,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <img
                  src={a.image}
                  alt={a.user}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>

              {/* Card */}
              <div
                style={{
                  flex: 1,
                  background: 'rgba(223,223,223,0.24)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '22px',
                  padding: '16px',
                  backdropFilter: 'blur(16px)',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    'translateY(-2px)';
                  e.currentTarget.style.background =
                    'rgba(255,255,255,0.14)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform =
                    'translateY(0px)';
                  e.currentTarget.style.background =
                    'rgba(255,255,255,0.08)';
                }}
              >
                {/* Accent Bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: a.color || '#8b5cf6',
                  }}
                />

                {/* Top */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        color: a.color || '#ffffff',
                        fontSize: '15px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.user}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.65)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '999px',
                        padding: '4px 8px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      thành viên
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.45)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {a.time}
                  </div>
                </div>

                {/* Action */}
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.78)',
                  }}
                >
                  {a.action}
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '14px',
                    paddingTop: '14px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '12px',
                  }}
                >
                  {/* Like */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'rgba(255,255,255,0.55)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#f472b6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color =
                        'rgba(255,255,255,0.55)';
                    }}
                  >
                    ♡ {Math.floor(Math.random() * 10) + 1}
                  </div>

                  {/* Comment */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'rgba(255,255,255,0.55)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#60a5fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color =
                        'rgba(255,255,255,0.55)';
                    }}
                  >
                    💬 Bình luận
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FamilyTimeline;