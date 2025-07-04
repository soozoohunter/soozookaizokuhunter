// frontend/src/App.js (最終版)
import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { AuthContext } from './AuthContext';

import HomePage from './pages/Home';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/Contact';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/DashboardPage';
import FileDetailPage from './pages/FileDetailPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ProtectedRoute from './components/ProtectedRoute';

function RootLayout() {
  const { token, logout } = useContext(AuthContext);
  let userRole = '';

  if (token) {
    try {
      const decoded = jwt_decode(token);
      userRole = decoded.role || '';
    } catch (e) { console.error('Invalid token decode', e); }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
            <Link to="/pricing" style={styles.navLink}>Pricing</Link>
            <Link to="/contact" style={styles.navLink}>Contact Us</Link>
        </div>
        <div style={styles.headerCenter}>
            <Link to="/" style={styles.brandLink}>
                <img src="/logo0.jpg" alt="Logo" style={styles.logoImg} />
                <span style={styles.brandText}>SUZOO IP Guard</span>
            </Link>
        </div>
        <div style={styles.headerRight}>
            {!token ? (
                <>
                    <Link to="/register" style={styles.navButton}>Register</Link>
                    <Link to="/login" style={{...styles.navButton, ...styles.loginButton}}>Login</Link>
                    <Link to="/admin/login" style={styles.navLink}>Admin</Link>
                </>
            ) : (
                <>
                    <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
                    {userRole === 'admin' && (
                        <Link to="/admin/dashboard" style={styles.navLink}>Admin Panel</Link>
                    )}
                    <button onClick={logout} style={styles.logoutButton}>Logout</button>
                </>
            )}
        </div>
      </header>
      <main style={styles.mainContent}><Outlet /></main>
      <footer style={styles.footer}>
          <div>為紀念我最深愛的 曾李素珠 阿嬤<br /><span style={{ fontSize: '0.8rem', opacity: 0.85 }}>In loving memory of my beloved grandmother, Tseng Li Su-Chu.<br />by KaiKaiShield 凱盾</span></div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* --- 公開路由 --- */}
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* --- 受保護的會員路由 (會員和管理員皆可訪問) --- */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="file/:fileId" element={<FileDetailPage />} />
          </Route>

          {/* --- 受保護的管理員路由 (僅限管理員訪問) --- */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
    container: { fontFamily: '"Inter", "Roboto", sans-serif', backgroundColor: '#111827', color: '#E5E7EB', display: 'flex', flexDirection: 'column', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: 'rgba(17, 24, 39, 0.8)', borderBottom: '1px solid #374151', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 1000 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '2rem' },
    headerCenter: { flexGrow: 1, display: 'flex', justifyContent: 'center' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    brandLink: { display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#F3F4F6' },
    logoImg: { height: '40px', marginRight: '0.75rem' },
    brandText: { fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.5px' },
    navLink: { color: '#D1D5DB', textDecoration: 'none', fontSize: '1rem', padding: '0.5rem 0.75rem', transition: 'color 0.2s ease, background-color 0.2s ease', borderRadius: '6px' },
    navButton: { color: '#FFFFFF', textDecoration: 'none', fontSize: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #F97316', backgroundColor: 'transparent', transition: 'background-color 0.2s ease, color 0.2s ease', cursor: 'pointer' },
    loginButton: { backgroundColor: '#F97316', color: '#FFFFFF', fontWeight: 'bold', marginLeft: '0.5rem' },
    logoutButton: { color: '#E5E7EB', textDecoration: 'none', fontSize: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #4B5563', backgroundColor: 'transparent', transition: 'background-color 0.2s ease, color 0.2s ease', cursor: 'pointer', fontFamily: 'inherit' },
    mainContent: { flexGrow: 1, padding: '2rem' },
    footer: { textAlign: 'center', padding: '1.5rem', backgroundColor: '#1F2937', borderTop: '1px solid #374151', fontSize: '0.9rem', color: '#9CA3AF' },
};
