/**************************************************************
 * frontend/src/App.js
 * - 維持您原先的頁面路由與 UI
 * - ★ 新增 /admin/login & /admin/dashboard
 * - ★ 新增「Admin Login」連結(固定)；若 userRole==='admin' 也顯示「Admin Dashboard」
 **************************************************************/
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

// 主要頁面
import HomePage from './pages/Home';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Payment from './pages/Payment'; 
import PaymentSuccess from './pages/PaymentSuccess';

// 4-Step Protect 流程
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4Infringement from './pages/ProtectStep4Infringement';

// Contact Us 頁面
import ContactPage from './pages/Contact';

// ★ 新增：AdminLogin、AdminDashboard
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function RootLayout() {
  const token = localStorage.getItem('token');
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

  // 導覽列按鈕的樣式
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
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo0.jpg" alt="Logo" style={{ height: '60px', marginRight: '1rem' }} />
          <span style={styles.logoText}>速誅侵權獵人 SUZOO IP Guard</span>
        </Link>

        <nav>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
          <Link to="/contact" style={navLinkStyle}>Contact Us</Link>

          {/* Hunter for Free */}
          <Link to="/protect/step1" style={navLinkStyle}>
            Hunter for Free
          </Link>

          {/* 固定顯示 Admin Login (若想隱藏可自行拿掉) */}
          <Link to="/admin/login" style={navLinkStyle}>Admin Login</Link>

          {/* 若 userRole==='admin' 顯示 Admin Dashboard */}
          {userRole === 'admin' && (
            <Link to="/admin/dashboard" style={navLinkStyle}>
              Admin Dashboard
            </Link>
          )}

          {/* 若有 token, 顯示 Payment & Logout；否則顯示 Login / Register */}
          {token ? (
            <>
              <Link to="/payment" style={navLinkStyle}>Payment</Link>
              <button
                onClick={handleLogout}
                style={{ ...navLinkStyle, border: 'none', background: 'none' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={navLinkStyle}>Login</Link>
              <Link to="/register" style={navLinkStyle}>Register</Link>
            </>
          )}
        </nav>
      </header>

      {/* 頁面頂部 Banner (只在首頁顯示) */}
      {showBanner && (
        <section style={styles.banner}>
          <h1 style={styles.bannerTitle}>
            Secure Your Intellectual Property: Instantly. Precisely. Effortlessly.
          </h1>
          <p style={styles.bannerDesc}>
            捍衛你的智慧財產權，即刻且準確。結合區塊鏈與AI智慧技術，
            24小時全方位偵測與追蹤侵權行為，為你的影音、圖像、文字與商標提供強力法律證據。
          </p>
        </section>
      )}

      <main style={{ padding: '2rem', flex: 1 }}>
        <Outlet />
      </main>

      <footer style={styles.footer}>
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

// ★ 主要路由
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1) 使用 RootLayout 包住一般使用者頁面 */}
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Protect */}
          <Route path="protect">
            <Route path="step1" element={<ProtectStep1 />} />
            <Route path="step2" element={<ProtectStep2 />} />
            <Route path="step3" element={<ProtectStep3 />} />
            <Route path="step4-infringement" element={<ProtectStep4Infringement />} />
          </Route>

          {/* Payment */}
          <Route path="payment" element={<Payment />} />
          <Route path="payment/success" element={<PaymentSuccess />} />
        </Route>

        {/* 2) Admin Route (不使用 RootLayout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

// 保留您的 UI 設計風格
const styles = {
  container: {
    fontFamily: 'Roboto, sans-serif',
    backgroundColor: '#101010',
    color: '#e0e0e0',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '1rem 2rem',
    borderBottom: '1px solid #444',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoText: {
    color: '#ff6f00',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  banner: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#1c1c1c',
    borderBottom: '4px solid #ff6f00'
  },
  bannerTitle: {
    fontSize: '2.3rem',
    color: '#ff6f00',
    fontFamily: '"Montserrat", sans-serif'
  },
  bannerDesc: {
    fontSize: '0.95rem',
    color: '#ccc',
    marginTop: '1rem',
    lineHeight: '1.5'
  },
  footer: {
    textAlign: 'center',
    padding: '1rem',
    background: '#181818',
    borderTop: '1px solid #444',
    fontSize: '0.9rem',
    color: '#aaa'
  }
};
