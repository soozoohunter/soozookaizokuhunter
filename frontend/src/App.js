// frontend/src/App.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function App() {
  // -- Inline style
  const containerStyle = {
    backgroundColor: '#000', // 黑底
    color: '#f00',
    minHeight: '100vh',
    margin: 0,
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem'
  };

  const bannerStyle = {
    textAlign: 'center',
    padding: '2rem',
    border: '2px solid #f00',
    margin: '0 1rem'
  };

  // 速誅 (72px)
  const mainTitleStyle = {
    fontSize: '72px',
    fontWeight: 'bold',
    margin: '0.5rem 0'
  };

  // 侵權獵人系統 (48px) - 書法體
  const subTitleStyle = {
    fontSize: '48px',
    margin: '0.5rem 0',
    fontFamily: '"KaiTi", "DFKai-SB", "STKaiti", serif'
  };

  const mainContentStyle = {
    flex: 1,
    padding: '1rem'
  };

  const footerStyle = {
    textAlign: 'center',
    padding: '1rem',
    marginTop: 'auto',
    fontSize: '0.85rem' // 縮小字體
  };

  const navLinkStyle = {
    margin: '0 0.5rem',
    color: '#f00',
    textDecoration: 'none',
    fontWeight: 'bold'
  };

  const actionButtonStyle = {
    margin: '0 0.5rem',
    fontSize: '1.2rem',
    backgroundColor: '#f00',
    color: '#fff',
    padding: '0.5rem 1rem',
    textDecoration: 'none',
    borderRadius: '4px'
  };

  return (
    <div style={containerStyle}>
      {/* 頂部導覽列 */}
      <header style={headerStyle}>
        <nav className="nav-links">
          <Link to="/" style={navLinkStyle}>速誅侵權獵人</Link>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
          <Link to="/login" style={navLinkStyle}>Login</Link>
          <Link to="/register" style={navLinkStyle}>Register</Link>
          <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
          <Link to="/upload" style={navLinkStyle}>Upload</Link>
          <Link to="/platform-accounts" style={navLinkStyle}>Platforms</Link>
          <Link to="/infringements" style={navLinkStyle}>Infringement</Link>
        </nav>
      </header>

      {/* 大字 Banner 區塊 */}
      <div style={bannerStyle}>
        <h1 style={mainTitleStyle}>速誅</h1>
        <h2 style={subTitleStyle}>侵權獵人系統</h2>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/register" style={actionButtonStyle}>註冊</Link>
          <Link to="/login" style={actionButtonStyle}>登入</Link>
        </div>
      </div>

      {/* 中間主要內容：Outlet (子頁面) */}
      <main style={mainContentStyle}>
        <Outlet />
      </main>

      {/* 底部紀念文字 (縮小 + 新增 by...) */}
      <footer style={footerStyle}>
        <div>
          為了紀念我最深愛的奶奶 曾李素珠小仙女 所開發<br/>
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>by 下輩子再當您孫子 凱</span>
        </div>
      </footer>
    </div>
  );
}
