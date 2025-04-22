// frontend/src/App.js

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useLocation,
  BrowserRouter
} from 'react-router-dom';
import jwt_decode from 'jwt-decode';

// ★ 原本就有的頁面
import HomePage from './pages/Home';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';

// ★ 新增：ProtectNow 四步驟頁面
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4Infringement from './pages/ProtectStep4Infringement';

function RootLayout() {
  // 判斷 token
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
    <div style={styles.container}>
      {/* === 頂部 Header === */}
      <header style={styles.header}>
        <Link to="/" style={{ display:'flex', alignItems:'center', textDecoration:'none' }}>
          {/* 台灣國旗 (示範 /tw_flag.png 檔案) */}
          <img 
            src="/tw_flag.png" 
            alt="TaiwanFlag" 
            style={{ height:'30px', marginRight:'8px' }} 
          />
          {/* 您原本的 Unicorn/Logo */}
          <img 
            src="/logo0.jpg" 
            alt="Logo" 
            style={{ height:'60px', marginRight:'1rem' }} 
          />
          <span style={styles.logoText}>速誅侵權獵人 SUZOO IP Guard</span>
        </Link>

        <nav>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
          <Link to="/contact" style={navLinkStyle}>Contact Us</Link>
          {/* ProtectNow -> step1 */}
          <Link to="/protect/step1" style={navLinkStyle}>ProtectNow</Link>
          
          {/* Admin Dashboard */}
          {isLoggedIn && userRole === 'admin' && (
            <Link to="/admin" style={navLinkStyle}>Admin Dashboard</Link>
          )}

          {isLoggedIn ? (
            <>
              <Link to="/payment" style={navLinkStyle}>Payment</Link>
              <button 
                onClick={handleLogout} 
                style={{ ...navLinkStyle, border:'none', background:'none' }}
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

      {/* === 首頁 Banner 區塊 (只在 path='/' 顯示) === */}
      {showBanner && (
        <section style={styles.banner}>
          <h1 style={styles.bannerTitle}>Secure Your Intellectual Property: Instantly. Precisely. Effortlessly.</h1>
          <p style={styles.bannerDesc}>
            捍衛你的智慧財產權，即刻且準確。結合區塊鏈與AI技術，
            24小時全方位掃描並追蹤全球侵權行為，
            為你的原創影音、圖像、文字與商標提供最有力的法律證據與自動保護。
          </p>
        </section>
      )}

      <main style={{ padding:'2rem', flex:1 }}>
        <Outlet />
      </main>

      {/* === Footer === */}
      <footer style={styles.footer}>
        <div>
          為紀念我最深愛的 曾李素珠 阿嬤
          <br />
          <span style={{ fontSize:'0.8rem', opacity:0.85 }}>
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
          {/* 首頁 */}
          <Route index element={<HomePage />} />
          {/* Pricing, Contact, Admin... */}
          <Route path="pricing" element={<PricingPage />} />
          {/* ProtectNow 四步驟 */}
          <Route path="protect">
            <Route path="step1" element={<ProtectStep1 />} />
            <Route path="step2" element={<ProtectStep2 />} />
            <Route path="step3" element={<ProtectStep3 />} />
            <Route path="step4-infringement" element={<ProtectStep4Infringement />} />
          </Route>

          {/* Payment & success */}
          <Route path="payment" element={<Payment />} />
          <Route path="payment/success" element={<PaymentSuccess />} />

          {/* Login / Register */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

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
