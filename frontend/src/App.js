import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function App() {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  let userRole = '';
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role || '';
    } catch (e) {
      console.error('Invalid token decode', e);
    }
  }

  const location = useLocation();
  const showBanner = (location.pathname === '/');

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
    <div style={{
      fontFamily: 'Roboto, sans-serif',
      backgroundColor: '#101010',
      color: '#e0e0e0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 頂部導覽列 */}
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #444',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/logo0.jpg"
            alt="Logo"
            style={{ height: '60px', width: 'auto', marginRight: '1rem' }}
          />
          <span style={{
            color: '#ff6f00',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            速誅侵權獵人 SUZOO IP Guard
          </span>
        </Link>

        <nav>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
          {/* 新增 Contact Us */}
          <Link to="/contact" style={navLinkStyle}>Contact Us</Link>

          {/* 僅在 role='admin' 顯示 Admin Dashboard */}
          {isLoggedIn && userRole === 'admin' && (
            <Link to="/admin" style={navLinkStyle}>Admin Dashboard</Link>
          )}

          {isLoggedIn ? (
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

      {/* 首頁橫幅 (只在 path='/' 顯示) */}
      {showBanner && (
        <section style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#1c1c1c',
          borderBottom: '4px solid #ff6f00'
        }}>
          <h1 style={{
            fontSize: '2.3rem',
            color: '#ff6f00',
            fontFamily: '"Montserrat", sans-serif'
          }}>
            Secure Your Intellectual Property: Instantly. Precisely. Effortlessly.
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: '#ccc',
            marginTop: '1rem',
            lineHeight: '1.5'
          }}>
            捍衛你的智慧財產權，即刻且準確。結合區塊鏈與AI技術，24小時自動掃描並追蹤全球任何侵權行為，
            為你的影音、圖像、文字與商標提供具法律效力的證據與自動保護。
          </p>
        </section>
      )}

      {/* 主要內容 */}
      <main style={{ padding: '2rem', flex: 1 }}>
        <Outlet />
      </main>

      {/* 頁尾 */}
      <footer style={{
        textAlign: 'center',
        padding: '1rem',
        background: '#181818',
        borderTop: '1px solid #444',
        fontSize: '0.9rem',
        color: '#aaa'
      }}>
        <div>
          為紀念我最深愛的 曾李素珠 阿嬤<br />
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            In loving memory of my beloved grandmother, Tseng Li Su-Chu.<br />
            by Ka!KaiShield 凱盾
          </span>
        </div>
      </footer>
    </div>
  );
}
