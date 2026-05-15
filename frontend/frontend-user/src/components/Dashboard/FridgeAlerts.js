const FridgeAlerts = ({ fridgeAlerts = [] }) => {
  return (
    <div
      style={{
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '28px',
        padding: '24px',
        background: 'rgba(15, 15, 25, 0.72)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.24)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Fridge Image */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '46%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.35,
          maskImage:
            'linear-gradient(to right, transparent 0%, black 45%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 45%)',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=1200"
          alt="Fridge"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Purple Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-80px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'rgba(139,92,246,0.18)',
          filter: 'blur(90px)',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '22px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 0 6px rgba(239,68,68,0.15)',
            }}
          />

          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '2px',
              }}
            >
              Sắp hết hạn
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Thực phẩm cần ưu tiên sử dụng
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.08)',
            color: '#ffffff',
            padding: '10px 14px',
            borderRadius: '14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            backdropFilter: 'blur(12px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              'rgba(255,255,255,0.14)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              'rgba(255,255,255,0.08)';
          }}
        >
          Mở tủ lạnh →
        </button>
      </div>

      {/* Alert Items */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '58%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {fridgeAlerts.map((item, i) => {
          const isUrgent = item.daysLeft <= 2;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '18px',
                background: isUrgent
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(255,255,255,0.08)',
                border: isUrgent
                  ? '1px solid rgba(239,68,68,0.2)'
                  : '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  'translateY(0px)';
              }}
            >
              {/* Food Image */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>

              {/* Text */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: isUrgent
                      ? '#e73737'
                      : 'rgba(253,224,179,0.7)',
                  }}
                >
                  {item.daysLeft} ngày còn lại
                </div>
              </div>

              {/* Status Dot */}
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isUrgent
                    ? '#ef4444'
                    : 'rgba(255,255,255,0.35)',
                  flexShrink: 0,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FridgeAlerts;