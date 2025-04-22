// frontend/src/App.js

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useLocation
} from 'react-router-dom';
import jwt_decode from 'jwt-decode';

// ★ 引入您自己的頁面組件
import HomePage from './pages/Home';
import PricingPage from './pages/PricingPage';
// Step1：新的TryProtect (檔案上傳 + title)
import TryProtect from './pages/TryProtect';
// Step2：Payment
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';

// Login / Register
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// 自訂: step1 details 頁面 (若您還需要TryProtectDetails，可自己import)
import TryProtectDetails from './pages/TryProtectDetails';

function RootLayout() {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  let userRole = '';
  if (token) {
    try {
      const decoded = jwt_decode(token);
      userRole = decoded.role || '';
    } catch (e) {
      console.error('Invalid token decode', e);
    }
  }

  const location = useLocation();
  const showBanner = location.pathname === '/';

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

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
      {/* 頂部 Header */}
      <header
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
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

        <nav>
          <Link to="/pricing" style={navLinkStyle}>
            Pricing
          </Link>
          <Link to="/contact" style={navLinkStyle}>
            Contact Us
          </Link>
          {/* 新增: FreeTrial */}
          <Link to="/try-protect" style={navLinkStyle}>
            Free Trial
          </Link>

          {isLoggedIn && userRole === 'admin' && (
            <Link to="/admin" style={navLinkStyle}>
              Admin Dashboard
            </Link>
          )}

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

      {/* 首頁Banner: 只在 '/' 顯示 */}
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

      <main style={{ padding: '2rem', flex: 1 }}>
        <Outlet />
      </main>

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="pricing" element={<PricingPage />} />

          {/* Step1: TryProtect => 上傳檔案 + 標題 */}
          <Route path="try-protect" element={<TryProtect />} />
          <Route path="try-protect/details" element={<TryProtectDetails />} />

          {/* Step2: Payment */}
          <Route path="payment" element={<Payment />} />
          <Route path="payment/success" element={<PaymentSuccess />} />

          {/* Login/Register */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* 其他路由 (contact, admin...) */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
