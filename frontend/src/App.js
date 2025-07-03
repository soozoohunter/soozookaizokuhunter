/**************************************************************
 * frontend/src/App.js
 * 維持您既有 Navbar/Banner/UI；追加 Protect Step1~4 完整路由
 * - 加強容器之霓虹漸層效果
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

import HomePage from './pages/Home';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/Contact';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import DashboardPage from './pages/DashboardPage';
import FileDetailPage from './pages/FileDetailPage';

// Protect (4-steps)
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4 from './pages/ProtectStep4';

// Admin
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';

function RootLayout() {
  const token = localStorage.getItem('token') || '';
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
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link to="/pricing" style={styles.navLink}>Pricing</Link>
          <Link to="/contact" style={styles.navLink}>Contact Us</Link>
        </div>

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

        <div style={styles.headerRight}>
          {!token && (
            <>
              <Link to="/register" style={styles.navLink}>Register</Link>
              <Link to="/login" style={styles.navLink}>Login</Link>
            </>
          )}
          {userRole === 'admin' ? (
            <Link to="/admin/dashboard" style={styles.navLink}>Admin</Link>
          ) : (
            <Link to="/admin/login" style={styles.navLink}>Admin</Link>
          )}
          {token && (
            <button
              onClick={handleLogout}
              style={{
                ...styles.navLink,
                border: 'none',
                background: 'none',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {showBanner && (
        <section style={styles.banner}>
          <h1 style={styles.bannerTitle}>
            World's First Unstoppable Copyright Protection
          </h1>
          <p style={styles.bannerDesc}>
            One-Click Originality. End Infringements Forever. 
            <br /><br />
            區塊鏈 + AI Copyright Shield，從此不再擔心抄襲與侵權。
            讓您的創作擁有<strong>無可撼動</strong>的法律證據！
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
            by KaiKaiShield 凱盾
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
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
         <Route path="register" element={<RegisterPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="file/:fileId" element={<FileDetailPage />} />

          {/* Protect: Step1~4 */}
          <Route path="protect">
            <Route path="step1" element={<ProtectStep1 />} />
            <Route path="step2" element={<ProtectStep2 />} />
          <Route path="step3" element={<ProtectStep3 />} />
          <Route path="step4" element={<ProtectStep4 />} />
          </Route>

          <Route path="payment" element={<Payment />} />
          <Route path="payment/success" element={<PaymentSuccess />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Routes>
    </BrowserRouter>
  );
}

/* ====== Styles ====== */
const styles = {
  container: {
    fontFamily: 'Roboto, sans-serif',
    // 漸層 + neon
    background: 'linear-gradient(135deg, #101010, #1a1a1a, #111, #2b2b2b)',
    backgroundSize: '400% 400%',
    color: '#e0e0e0',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'flowBg 12s ease infinite'
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
    fontSize: '2.4rem',
    color: '#ff6f00',
    fontFamily: '"Montserrat", sans-serif',
    textShadow: '0 0 8px #ff6f00'
  },
  bannerDesc: {
    fontSize: '1rem',
    color: '#ccc',
    marginTop: '1rem',
    lineHeight: '1.6'
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
