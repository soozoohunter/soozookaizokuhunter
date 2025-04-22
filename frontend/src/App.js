// frontend/src/App.js

import React from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode'; // ← 改用 ES import

// ★ 引入您自己的頁面組件 (若有不同檔名請自行調整)
import HomePage from './pages/Home';
import PricingPage from './pages/PricingPage';
import TryProtect from './pages/TryProtect';
import TryProtectDetails from './pages/TryProtectDetails';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';

/* ------------------------------------------------------------------
   RootLayout：含導覽列、Banner、Footer
   ------------------------------------------------------------------ */
function RootLayout() {
  // 1) 檢查是否有 token
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // 2) 如果有 token，就 decode，拿到 userRole
  let userRole = '';
  if (token) {
    try {
      const decoded = jwt_decode(token);
      userRole = decoded.role || '';
    } catch (e) {
      console.error('Invalid token decode', e);
    }
  }

  // 3) 判斷當前路徑是否在 '/'，用於顯示首頁 Banner
  const location = useLocation();
  const showBanner = (location.pathname === '/');

  // 4) 登出動作
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // 5) 導覽列的樣式
  const navLinkStyle = {
    margin: '0 1rem',
    color: '#e0e0e0',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    border: '1px solid #ff6f00',
    borderRadius: '4px'
  };

  return (
    <div
      style={{
        fontFamily: 'Roboto, sans-serif',
        backgroundColor: '#101010',
        color: '#e0e0e0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ================== 頂部 Header：LOGO + 導覽列 ================== */}
      <header
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* 左側：LOGO 與系統名稱 */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none'
          }}
        >
          <img
            src="/logo0.jpg"
            alt="Logo"
            style={{ height: '60px', width: 'auto', marginRight: '1rem' }}
          />
          <span
            style={{
              color: '#ff6f00',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
          >
            速誅侵權獵人 SUZOO IP Guard
          </span>
        </Link>

        {/* 右側：導覽列按鈕 */}
        <nav>
          <Link to="/pricing" style={navLinkStyle}>
            Pricing
          </Link>
          {/* 若有 /contact 頁面，可以這裡加 */}
          <Link to="/contact" style={navLinkStyle}>
            Contact Us
          </Link>

          {/* 如果已登入且 role=admin，顯示 Admin Dashboard */}
          {isLoggedIn && userRole === 'admin' && (
            <Link to="/admin" style={navLinkStyle}>
              Admin Dashboard
            </Link>
          )}

          {/* 若已登入 => 顯示 Payment 與 Logout；未登入 => 顯示 Login/Register */}
          {isLoggedIn ? (
            <>
              <Link to="/payment" style={navLinkStyle}>
                Payment
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  ...navLinkStyle,
                  border: 'none',
                  background: 'none'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={navLinkStyle}>
                Login
              </Link>
              <Link to="/register" style={navLinkStyle}>
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* ================== 首頁 Banner：只在 path='/' 時顯示 ================== */}
      {showBanner && (
        <section
          style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#1c1c1c',
            borderBottom: '4px solid #ff6f00'
          }}
        >
          <h1
            style={{
              fontSize: '2.3rem',
              color: '#ff6f00',
              fontFamily: '"Montserrat", sans-serif'
            }}
          >
            Secure Your Intellectual Property: Instantly. Precisely. Effortlessly.
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              color: '#ccc',
              marginTop: '1rem',
              lineHeight: '1.5'
            }}
          >
            捍衛你的智慧財產權，即刻且準確。結合區塊鏈與AI智慧技術，
            24小時全方位掃描並追蹤全球侵權行為，
            為你的原創影音、圖像、文字與商標提供最有力的法律證據與自動保護。
          </p>
        </section>
      )}

      {/* ================== 主內容：Outlet 呈現子頁面 ================== */}
      <main style={{ padding: '2rem', flex: 1 }}>
        <Outlet />
      </main>

      {/* ================== 頁尾 Footer ================== */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1rem',
          background: '#181818',
          borderTop: '1px solid #444',
          fontSize: '0.9rem',
          color: '#aaa'
        }}
      >
        <div>
          為紀念我最深愛的 曾李素珠 阿嬤
          <br />
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            In loving memory of my beloved grandmother, Tseng Li Su-Chu.
            <br />
            by Ka!KaiShield 凱盾
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------
   App：BrowserRouter + 巢狀路由
   ------------------------------------------------------------------ */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* 首頁 => '/' */}
          <Route index element={<HomePage />} />

          {/* 定價頁 */}
          <Route path="pricing" element={<PricingPage />} />

          {/* 免費試用頁 */}
          <Route path="try-protect" element={<TryProtect />} />
          <Route path="try-protect/details" element={<TryProtectDetails />} />

          {/* 付款頁 */}
          <Route path="payment" element={<Payment />} />
          <Route path="payment/success" element={<PaymentSuccess />} />

          {/* 其他路由(如 contact, admin, login, register) 亦可加上 */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
