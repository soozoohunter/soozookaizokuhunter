/**************************************************************
 * frontend/src/App.js
 * 維持您既有 Navbar/Banner/UI；追加 Protect Step1~4 完整路由
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

// 1) 一般頁面
import HomePage from './pages/Home';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/Contact';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';

// 2) Protect (4-steps)
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4Infringement from './pages/ProtectStep4Infringement'; // ←注意import名稱

// 3) Admin
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

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
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div style={styles.container}>
      {/* ====== Header / Navbar ====== */}
      <header style={styles.header}>
        {/* 左側連結區: Pricing / Contact */}
        <div style={styles.headerLeft}>
          <Link to="/pricing" style={styles.navLink}>Pricing</Link>
          <Link to="/contact" style={styles.navLink}>Contact Us</Link>
        </div>

        {/* 中間品牌 Logo */}
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

        {/* 右側連結區: Register / Login / Admin / Logout */}
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

      {/* ====== 首頁 Banner 區塊 ====== */}
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

      {/* ====== 主內容 (Outlet) ====== */}
      <main style={{ padding: '2rem', flex: 1 }}>
        <Outlet />
      </main>

      {/* ====== Footer ====== */}
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

// ====== App ======
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1) 包含 Navbar / Footer 的 Layout */}
        <Route element={<RootLayout />}>
          {/* 首頁 (index) */}
          <Route index element={<HomePage />} />

          {/* 一般頁面 */}
          <Route path="pricing" element={<PricingPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Protect 流程: Step1~4 */}
          <Route path="protect">
            <Route path="step1" element={<ProtectStep1 />} />
            <Route path="step2" element={<ProtectStep2 />} />
            <Route path="step3" element={<ProtectStep3 />} />
            <Route path="step4-infringement" element={<ProtectStep4Infringement />} />
          </Route>

          {/* 付款 */}
          <Route path="payment" element={<Payment />} />
          <Route path="payment/success" element={<PaymentSuccess />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

/* ====== Styles ====== */
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
    fontSize: '2.4rem',
    color: '#ff6f00',
    fontFamily: '"Montserrat", sans-serif'
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
