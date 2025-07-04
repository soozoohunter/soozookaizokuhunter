// frontend/src/App.js (UI 修正與邏輯優化版)
import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { AuthContext } from './AuthContext';

// --- Pages ---
import HomePage from './pages/Home';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/Contact';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import DashboardPage from './pages/DashboardPage';
import FileDetailPage from './pages/FileDetailPage';
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4 from './pages/ProtectStep4';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';

// --- Components ---
import ProtectedRoute from './components/ProtectedRoute';

function RootLayout() {
  const { token, logout } = useContext(AuthContext);
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
    logout();
    window.location.href = '/login';
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
                <img src="/logo0.jpg" alt="Logo" style={{ height: '40px', marginRight: '0.5rem' }} />
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>SUZOO IP Guard</span>
            </Link>
        </div>
        <div style={styles.headerRight}>
            {!token ? (
                <>
                    <Link to="/register" style={styles.navLink}>Register</Link>
                    <Link to="/login" style={styles.navLink}>Login</Link>
                    <Link to="/admin/login" style={styles.navLink}>Admin</Link>
                </>
            ) : (
                <>
                    <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
                    {userRole === 'admin' && (
                        <Link to="/admin/dashboard" style={styles.navLink}>Admin Panel</Link>
                    )}
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        Logout
                    </button>
                </>
            )}
        </div>
      </header>
      
      {showBanner && (
        <section style={styles.banner}>
           <h1 style={styles.bannerTitle}>
            World's First Unstoppable Copyright Protection
          </h1>
          <h2 style={styles.bannerSubtitle}>
            Blockchain Certification & AI Infringement Detection
          </h2>
        </section>
      )}

      <main style={styles.mainContent}>
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
          
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="file/:fileId" element={<FileDetailPage />} />
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
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// [UI FIX] Styles object with corrected flexbox properties
const styles = {
  container: {
    fontFamily: 'Roboto, sans-serif',
    backgroundColor: 'rgb(24, 24, 24)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    padding: '1rem 2rem',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    width: '100%',
    top: 0,
    zIndex: 1000,
    boxSizing: 'border-box',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  headerCenter: {
    // This part remains for the brand
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  brandLink: {
    color: '#fff',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  navLink: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1rem',
  },
  logoutButton: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  banner: {
    height: '400px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '2rem',
    marginTop: '60px', // Adjust for fixed header height
    background: 'linear-gradient(45deg, #ff6f00, #ff00ff, #00ffff)',
    backgroundSize: '200% 200%',
    animation: 'gradientAnimation 10s ease infinite',
  },
  bannerTitle: {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  },
  bannerSubtitle: {
    fontSize: '1.5rem',
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    marginTop: '60px', // Adjust for fixed header height
  },
  footer: {
    textAlign: 'center',
    padding: '1.5rem',
    backgroundColor: '#000',
  },
};

// Keyframes for background animation should be added to a global CSS file or via a style tag.
// For example, in your public/index.html:
/*
@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
*/
