const HeroSection = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(223, 223, 223, 0.38)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.12)',
      padding: '32px',
      gap: '32px',
      marginBottom: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Noise/glow decorators */}
      <div style={{
        position: 'absolute', top: '-80px', right: '30%',
        width: '260px', height: '260px', borderRadius: '50%',
        background: 'rgba(245,166,35,0.12)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
      }}/>
      <div style={{
        position: 'absolute', bottom: '-60px', left: '10%',
        width: '180px', height: '180px', borderRadius: '50%',
        background: 'rgba(139,92,246,0.15)',
        filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
      }}/>

      {/* Left — Nội dung chữ */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(245,166,35,0.18)',
          border: '1px solid rgba(245,166,35,0.35)',
          padding: '7px 16px', borderRadius: '20px',
          fontSize: '12px', fontWeight: 700,
          color: '#fbbf24', marginBottom: '20px',
          letterSpacing: '0.6px', textTransform: 'uppercase',
        }}>✨ Gợi ý hôm nay</div>

        <h2 style={{
          fontFamily: "'Nunito', sans-serif", fontWeight: 900,
          fontSize: '36px', color: '#ffffff', marginBottom: '16px',
          lineHeight: 1.15,
          textShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          Cơm bò lúc lắc<br/>từ nguyên liệu sẵn có
        </h2>

        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>
          ✅ Có sẵn: Thịt bò, Cà chua, Hành tây, Tỏi
        </p>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', marginBottom: '28px' }}>
          ❌ Còn thiếu: Ớt sừng, Nước tương
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            padding: '14px 28px', borderRadius: '13px',
            background: '#f59e0b', color: '#fff', border: 'none',
            fontFamily: "'Nunito', sans-serif", fontWeight: 800,
            fontSize: '15px', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(245,166,35,0.5)',
          }}>Xem công thức →</button>
          <button style={{
            padding: '14px 28px', borderRadius: '13px',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.2)',
            fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            fontSize: '15px', cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}>Thêm thực đơn</button>
        </div>
      </div>

      {/* Middle — Thông tin tóm tắt */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '20px',
        padding: '0 28px', flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,0.12)',
        borderRight: '1px solid rgba(255,255,255,0.12)',
        position: 'relative', zIndex: 1,
      }}>
        {[
          { label: '⏱️ Thời gian', value: '20 phút', color: '#ffffff' },
          { label: '🔥 Calo', value: '450 kcal', color: '#ffffff' },
          { label: '⭐ Độ khó', value: 'Dễ làm', color: '#4ade80' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.5)',
              marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{label}</div>
            <div style={{
              fontSize: '18px', color, fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
            }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Right — Video */}
      <div style={{
        width: '480px', height: '300px',
        position: 'relative', background: '#000',
        borderRadius: '16px', overflow: 'hidden', flexShrink: 0,
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 1,
      }}>
        <iframe
          src="https://www.youtube.com/embed/RfGrzXPuKeM?autoplay=1&mute=1&loop=1&playlist=RfGrzXPuKeM"
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.88))',
          padding: '60px 20px 20px',
          color: '#fff',
        }}>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 900,
            fontSize: '22px', marginBottom: '10px',
          }}>Cơm bò lúc lắc</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(34,197,94,0.85)', padding: '7px 14px',
            borderRadius: '20px', fontSize: '13px', fontWeight: 600,
          }}>▶ Xem video hướng dẫn</div>
        </div>
      </div>

    </div>
  );
};

export default HeroSection;