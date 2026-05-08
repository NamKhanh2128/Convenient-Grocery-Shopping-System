import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthController } from '../controllers/AuthController';
import { UserModel } from '../models/UserModel';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    if (errors[e.target.name]) setErrors({...errors, [e.target.name]: null});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const validation = isLogin
      ? UserModel.validateLogin(formData.email, formData.password)
      : UserModel.validateRegister(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    AuthController.handleLogin(
      { email: formData.email, password: formData.password },
      (user) => { navigate('/dashboard'); },
      (errs) => { setErrors(errs); setLoading(false); }
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#16171d',
      fontFamily: "'DM Sans', sans-serif",
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '28px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        maxWidth: '900px',
        width: '100%',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#111111',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: '24px',
              marginBottom: '8px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#F5A623"/>
                <path d="M6 12h12M12 6v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              NATEAT
            </Link>
            <h2 style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: '28px',
              color: '#111111',
              marginBottom: '8px'
            }}>{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</h2>
            <p style={{ fontSize: '14px', color: '#4b5563' }}>
              {isLogin ? 'Chào mừng bạn quay trở lại!' : 'Tạo tài khoản mới để bắt đầu'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>Họ tên</label>
                <input name="fullName" value={formData.fullName} onChange={handleChange}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${errors.fullName ? '#E74C3C' : '#e5e7eb'}`,
                    fontSize: '14px', fontFamily: 'inherit', transition: 'box-shadow 0.2s',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.25)'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                  placeholder="Nhập họ tên" />
                {errors.fullName && <span style={{ fontSize: '11px', color: '#E74C3C', marginTop: '4px', display: 'block' }}>{errors.fullName}</span>}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${errors.email ? '#E74C3C' : '#e5e7eb'}`,
                  fontSize: '14px', fontFamily: 'inherit', transition: 'box-shadow 0.2s', outline: 'none'
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.25)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
                placeholder="email@example.com" />
              {errors.email && <span style={{ fontSize: '11px', color: '#E74C3C', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>Mật khẩu</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${errors.password ? '#E74C3C' : '#e5e7eb'}`,
                  fontSize: '14px', fontFamily: 'inherit', transition: 'box-shadow 0.2s', outline: 'none'
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.25)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
                placeholder="Nhập mật khẩu" />
              {errors.password && <span style={{ fontSize: '11px', color: '#E74C3C', marginTop: '4px', display: 'block' }}>{errors.password}</span>}
            </div>

            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>Xác nhận mật khẩu</label>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${errors.confirmPassword ? '#E74C3C' : '#e5e7eb'}`,
                    fontSize: '14px', fontFamily: 'inherit', transition: 'box-shadow 0.2s', outline: 'none'
                  }}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.25)'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                  placeholder="Nhập lại mật khẩu" />
                {errors.confirmPassword && <span style={{ fontSize: '11px', color: '#E74C3C', marginTop: '4px', display: 'block' }}>{errors.confirmPassword}</span>}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '14px', background: '#F5A623', color: '#fff',
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '14px',
              boxShadow: '0 4px 18px rgba(245,166,35,0.45)', border: 'none', cursor: 'pointer',
              transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.5px',
              opacity: loading ? 0.7 : 1
            }} onMouseEnter={e => { if(!loading) e.target.style.transform = 'translateY(-2px)'; }}
               onMouseLeave={e => { e.target.style.transform = 'none'; }}>
              {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#4b5563', marginTop: '20px' }}>
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setErrors({}); setFormData({email:'',password:'',fullName:'',confirmPassword:''}); }}
              style={{ background: 'none', border: 'none', color: '#F5A623', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #F5A623 0%, #FFD166 100%)',
          padding: '48px 32px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          color: '#fff'
        }}>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '24px', marginBottom: '16px' }}>
            {isLogin ? 'Chào mừng trở lại!' : 'Tham gia cùng chúng tôi!'}
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9, marginBottom: '24px' }}>
            {isLogin
              ? 'Đăng nhập để quản lý thực phẩm, lập kế hoạch bữa ăn và giảm lãng phí thực phẩm cho gia đình.'
              : 'Tạo tài khoản để bắt đầu quản lý danh sách mua sắm, theo dõi tủ lạnh và lên thực đơn thông minh.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['🛒 Mua sắm thông minh', '❄️ Quản lý tủ lạnh', '🍽️ Lên thực đơn tự động', '📊 Thống kê chi tiêu'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>{item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
