const ShoppingList = ({ shoppingList }) => {
  const pct =
    Math.round((shoppingList.bought / shoppingList.total) * 100) || 0;

  return (
    <div
      style={{
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '28px',
        padding: '28px',
        background: 'rgba(223,223,223,0.51)',
        border: '1px solid rgba(255,255,255,0.08)',
        // backdropFilter: 'blur(24px)',
        // WebkitBackdropFilter: 'blur(24px)',
        willChange: 'transform',
        transform: 'translateZ(0)',
        contain: 'layout paint', 
        boxShadow: '0 12px 40px rgba(0,0,0,0.24)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '20px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Background Banner */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          height: '180px',
          opacity: 0.28,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200"
          alt="Shopping Banner"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-60px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'rgba(139,92,246,0.18)',
          filter: 'blur(80px)',
          zIndex: 0,
          willChange: 'transform',    
          transform: 'translateZ(0)',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=300"
            alt="Shopping Basket"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        <div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '4px',
            }}
          >
            {shoppingList.title || 'Chợ cuối tuần'}
          </div>

          <div
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {shoppingList.total} món cần mua
          </div>
        </div>
      </div>

      {/* Progress */}
      <div
        style={{
          marginBottom: '28px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Tiến độ
          </span>

          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            {pct}%
          </span>
        </div>

        <div
          style={{
            height: '10px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: '999px',
              background:
                'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #22c55e 100%)',
              transition: 'width 0.4s ease',
              boxShadow: '0 0 24px rgba(139,92,246,0.5)',
            }}
          />
        </div>
      </div>

      {/* Items */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {shoppingList.items.map((item, i) => (
          <label
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px',
              borderRadius: '20px',
              background: item.done ? 'rgba(255,255,255,0.7)' : '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              // backdropFilter: 'blur(16px)',
              willChange: 'transform',    
              transform: 'translateZ(0)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = item.done ? 'rgba(255,255,255,0.8)' : '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.background = item.done ? 'rgba(255,255,255,0.7)' : '#ffffff';
            }}
          >
            {/* Checkbox */}
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: item.done
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'transparent',
                border: item.done ? 'none' : '2px solid rgba(0,0,0,0.2)',
                fontSize: '13px',
                color: '#ffffff',
                transition: 'all 0.2s ease',
              }}
            >
              {item.done && '✓'}
            </div>

            {/* Image */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                overflow: 'hidden',
                flexShrink: 0,
                opacity: item.done ? 0.6 : 1,
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
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* Text */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: item.done ? 'rgba(0,0,0,0.35)' : '#111111',
                  textDecoration: item.done ? 'line-through' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {item.name}
              </span>

              {item.quantity && (
                <span
                  style={{
                    fontSize: '12px',
                    color: 'rgba(0,0,0,0.45)',
                  }}
                >
                  {item.quantity}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Footer */}
      <button
        style={{
          marginTop: '24px',
          width: '100%',
          padding: '16px',
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.08)',
          background:
            'linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.9))',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '15px',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: '0 10px 30px rgba(139,92,246,0.35)',
          position: 'relative',
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow =
            '0 16px 40px rgba(139,92,246,0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow =
            '0 10px 30px rgba(139,92,246,0.35)';
        }}
      >
        Xem tất cả →
      </button>
    </div>
  );
};

export default ShoppingList;