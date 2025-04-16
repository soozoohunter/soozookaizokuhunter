import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function App() {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const location = useLocation();
  const showBanner = !isLoggedIn && location.pathname === '/';

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#101010', color: '#e0e0e0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#ff6f00', fontSize: '1.5rem', textDecoration: 'none', fontWeight: 'bold' }}>速誅侵權獵人 SUZOO IP Guard</Link>
        <nav>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
          {!isLoggedIn ? (
            <>
              <Link to="/login" style={navLinkStyle}>Login</Link>
              <Link to="/register" style={navLinkStyle}>Register</Link>
            </>
          ) : (
            <>
              <Link to="/payment" style={navLinkStyle}>Payment</Link>
              <button onClick={handleLogout} style={{ ...navLinkStyle, border: 'none', background: 'none' }}>Logout</button>
            </>
          )}
        </nav>
      </header>

      {showBanner && (
        <section style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#1c1c1c', borderBottom: '4px solid #ff6f00' }}>
          <h1 style={{ fontSize: '3rem', color: '#ff6f00' }}>捍衛你的智慧財產權，自動且即刻。</h1>
          <p style={{ fontSize: '1.2rem', marginTop: '1rem', lineHeight: '1.6' }}>
            結合區塊鏈與AI智慧技術，24小時全天候掃描並追蹤全球侵權行為，
            為你的原創影音、圖像、文字與商標提供最有力的法律證據與自動保護。
          </p>
          <p style={{ fontSize: '1.1rem', color: '#ccc', marginTop: '1rem' }}>
            Protect your intellectual property with blockchain-powered evidence and AI infringement detection, providing indisputable protection worldwide.
          </p>
        </section>
      )}

      <main style={{ padding: '2rem', flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ textAlign: 'center', padding: '1rem', background: '#181818', borderTop: '1px solid #444', fontSize: '0.9rem', color: '#aaa' }}>
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

const navLinkStyle = {
  margin: '0 1rem',
  color: '#e0e0e0',
  textDecoration: 'none',
  fontWeight: '500',
  padding: '0.5rem 1rem',
  border: '1px solid #ff6f00',
  borderRadius: '4px'
};
