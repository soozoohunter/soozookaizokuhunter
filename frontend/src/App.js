// frontend/src/App.js (路由與邏輯修正版)
import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { AuthContext, AuthProvider } from './AuthContext'; // 引入 AuthProvider

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
  // 從 AuthContext 獲取 token 和 logout 方法，這是唯一的來源
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
    // 使用從 Context 來的 logout 方法，它會處理好所有狀態
    logout();
    // 使用 window.location.href 來強制重新載入頁面，確保所有狀態都被重置
    window.location.href = '/login';
  };

  return (
    <div style={styles.container}>
      {/* Navbar 的邏輯已根據 token 狀態正確渲染 */}
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
                    <button onClick={handleLogout} style={{ ...styles.navLink, border: 'none', background: 'none', cursor: 'pointer' }}>
                        Logout
                    </button>
                </>
            )}
        </div>
      </header>
      
      {showBanner && (
        <section style={styles.banner}>
          {/* Banner content remains the same */}
        </section>
      )}

      <main style={styles.mainContent}>
        <Outlet />
      </main>

      <footer style={styles.footer}>
        {/* Footer content remains the same */}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    // AuthProvider 已被移至 index.js，包裹整個 App
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* 公開路由 */}
          <Route index element={<HomePage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="payment" element={<Payment />} />
          <Route path="payment/success" element={<PaymentSuccess />} />

          {/* [FIX] 移除重複的、未受保護的路由 */}
          {/* <Route path="dashboard" element={<DashboardPage />} /> */}
          {/* <Route path="file/:fileId" element={<FileDetailPage />} /> */}

          {/* 受保護的會員路由 */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="file/:fileId" element={<FileDetailPage />} />
            <Route path="protect">
              <Route path="step1" element={<ProtectStep1 />} />
              <Route path="step2" element={<ProtectStep2 />} />
              <Route path="step3" element={<ProtectStep3 />} />
              <Route path="step4" element={<ProtectStep4 />} />
            </Route>
          </Route>

          {/* 管理員路由 (可以考慮也用 ProtectedRoute 包裹，並增加 role 判斷) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Styles object remains the same
const styles = { /* ... */ };
