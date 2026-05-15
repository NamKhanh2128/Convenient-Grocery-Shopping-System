import React, { useState } from 'react';

import DashboardHeader from '../components/Dashboard/DashboardHeader';
import HeroSection from '../components/Dashboard/HeroSection';
import MealCards from '../components/Dashboard/MealCards';
import ShoppingList from '../components/Dashboard/ShoppingList';
import FamilyTimeline from '../components/Dashboard/FamilyTimeline';
import FridgeAlerts from '../components/Dashboard/FridgeAlerts';

const DashboardPage = () => {
  const user = JSON.parse(
    localStorage.getItem('user') || '{"name":"Người dùng"}'
  );

  const [activeNav, setActiveNav] = useState('home');

  const todayMeals = [
    {
      slot: 'Sáng',
      dish: 'Phở bò tái',
      note: 'Đã nấu · 4 người',
      status: 'done',
      time: null,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      image:
        'https://cdnv2.tgdd.vn/mwg-static/common/Common/pho-tai-lan.jpg?w=800',
    },
    {
      slot: 'Trưa',
      dish: 'Cơm rang dưa bò',
      note: 'Đang chuẩn bị · 4 người',
      status: 'active',
      time: '11:30',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      image:
        'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
    },
    {
      slot: 'Tối',
      dish: 'Canh chua cá lóc',
      note: 'Đã lên kế hoạch',
      status: 'planned',
      time: '18:00',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.15)',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    },
  ];

  const shoppingList = {
    title: 'Chợ cuối tuần',
    bought: 5,
    total: 9,

    items: [
      {
        name: 'Cà chua bi (500g)',
        done: true,
        image:
          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300',
      },
      {
        name: 'Hành tây (2 củ)',
        done: true,
        image:
          'https://images.unsplash.com/photo-1508747703725-719777637510?w=300',
      },
      {
        name: 'Cá lóc tươi (1kg)',
        done: false,
        image:
          'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300',
      },
      {
        name: 'Đậu phụ (4 miếng)',
        done: false,
        image:
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300',
      },
      {
        name: 'Nước mắm Phú Quốc',
        done: false,
        image:
          'https://images.unsplash.com/photo-1472476443507-c7a5948772e3?w=300',
      },
    ],
  };

  const familyActivities = [
    {
      user: 'Nam',
      action: 'thêm "Cà chua, Thịt bò" vào danh sách mua sắm',
      time: '5 phút trước',
      image:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
      color: '#f59e0b',
    },
    {
      user: 'Hùng',
      action: 'cập nhật tủ lạnh: "Sữa tươi hết hạn 10/05"',
      time: '15 phút trước',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      color: '#8b5cf6',
    },
    {
      user: 'Thành',
      action: 'lên thực đơn "Bữa tối thứ 6"',
      time: '1 giờ trước',
      image:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      color: '#22c55e',
    },
    {
      user: 'Hùng',
      action: 'đánh dấu mua xong 3 mục trong danh sách',
      time: '2 giờ trước',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      color: '#f59e0b',
    },
  ];

  const fridgeAlerts = [
    {
      name: 'Thịt bò',
      expiry: '08/05/2026',
      daysLeft: 2,
      image:
        'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=300',
    },
    {
      name: 'Sữa tươi',
      expiry: '10/05/2026',
      daysLeft: 4,
      image:
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300',
    },
  ];

  const navItems = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },

    {
      id: 'shopping',
      label: 'Mua sắm',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
    },

    {
      id: 'fridge',
      label: 'Tủ lạnh',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
          <path d="M8 6h2M8 10h2M16 6h2M16 10h2" />
        </svg>
      ),
    },

    {
      id: 'meals',
      label: 'Thực đơn',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      ),
    },

    {
      id: 'reports',
      label: 'Báo cáo',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },

    {
      id: 'family',
      label: 'Gia đình',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f1115',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Blobs */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(139,92,246,0.12)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          bottom: '-15%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'rgba(34,197,94,0.08)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <DashboardHeader
        user={user}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        navItems={navItems}
      />

      {/* Main */}
      <main
        style={{
          padding: '36px 4vw 48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Greeting */}
        <div
          style={{
            marginBottom: '32px',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '28px',
            padding: '32px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.24)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-60px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'rgba(139,92,246,0.2)',
              filter: 'blur(80px)',
            }}
          />

          <h1
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: '52px',
              color: '#ffffff',
              marginBottom: '10px',
              lineHeight: 1.05,
              position: 'relative',
              zIndex: 1,
            }}
          >
            Chào {user.name} 👋
          </h1>

          <p
            style={{
              fontSize: '17px',
              color: 'rgba(255,255,255,0.65)',
              margin: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            Tủ lạnh có 12 món · 2 món sắp hết hạn · 3 món gợi ý hôm nay
          </p>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: '24px' }}>
          <HeroSection todayMeals={todayMeals} />
        </div>

        {/* Dashboard Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <MealCards todayMeals={todayMeals} />
            <FamilyTimeline
              familyActivities={familyActivities}
            />
          </div>

          {/* Right */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <ShoppingList shoppingList={shoppingList} />
            <FridgeAlerts fridgeAlerts={fridgeAlerts} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;