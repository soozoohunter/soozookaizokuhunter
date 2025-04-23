/**************************************************************
 * frontend/src/App.js
 * - Navbar 左: Pricing, Contact Us
 *           中: Logo + SUZOO IP Guard
 *           右: Register, Login, Admin
 * - Logo 檔名: logo0.jpg (請放在 public/ 下，或自行調整路徑)
 * - 去掉頂部「Hunter for Free」按鈕 (因已移至 Home 下方)
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

// Admin
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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        {/* 左邊 */}
        <div style={styles.headerLeft}>
          <Link to="/pricing" style={styles.navLink}>Pricing</Link>
          <Link to="/contact" style={styles.navLink}>Contact Us</Link>
        </div>

        {/* 中間 - Logo + SUZOO文字 */}
        <div style={styles.headerCenter}>
          <Link to="/" style={styles.brandLink}>
            <img 
              src="/logo0.jpg" 
              alt="Logo" 
              style={{ height: '40px', marginRight: '0.5rem' }}
            />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              SUZOO IP Guard
            </span>
          </Link>
        </div>

        {/* 右邊 */}
        <div style={styles.headerRight}>
          {!token && (
            <>
              <Link to="/register" style={styles.navLink}>Register</Link>
              <Link to="/login" style={styles.navLink}>Login</Link>
            </>
          )}

          {/* Admin 入口 (若您想固定顯示可保留) */}
          {userRole === 'admin' ? (
            <Link to="/admin/dashboard" style={styles.navLink}>Admin</Link>
          ) : (
            <Link to="/admin/login" style={styles.navLink}>Admin</Link>
          )}

          {token && (
            <button
              onClick={handleLogout}
              style={{ ...styles.navLink, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* 首頁的 Banner */}
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1) 一般頁面 */}
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

        {/* 2) Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

// 樣式
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
    display: 'flex',
    padding: '0.5rem 2rem',
    borderBottom: '1px solid #444',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  headerCenter: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  navLink: {
    color: '#e0e0e0',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    border: '1px solid #ff6f00',
    borderRadius: '4px'
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    textDecoration: 'none',
    color: '#ff6f00'
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
