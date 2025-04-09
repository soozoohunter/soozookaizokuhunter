// frontend/src/App.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function App() {
  // 判斷有無 token
  const token = localStorage.getItem('token'); 
  const isLoggedIn = !!token;  // 若 token 不為空字串 => true

  // === 您現有的 style ===
  const containerStyle = {
    backgroundColor: '#000', 
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

  const mainTitleStyle = {
    fontSize: '72px',
    fontWeight: 'bold',
    margin: '0.5rem 0'
  };

  const subTitleStyle = {
    fontSize: '48px',
    fontFamily: '"KaiTi","DFKai-SB","serif"',
    margin: '0.5rem 0'
  };

  const mainContentStyle = {
    flex: 1,
    padding: '1rem'
  };

  const footerStyle = {
    textAlign: 'center',
    padding: '1rem',
    marginTop: 'auto',
    fontSize: '0.85rem',
    color: '#fff'
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
      {/* 導覽列 */}
      <header style={headerStyle}>
        <nav>
          {/* 1) 通用連結 */}
          <Link to="/" style={navLinkStyle}>速誅侵權獵人</Link>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>

          {/* 2) 未登入時 => 顯示 Login / Register */}
          {!isLoggedIn && (
            <>
              <Link to="/login" style={navLinkStyle}>Login</Link>
              <Link to="/register" style={navLinkStyle}>Register</Link>
            </>
          )}

          {/* 3) 已登入時 => 顯示 Dashboard / Upload / Platform / Infringement */}
          {isLoggedIn && (
            <>
              <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
              <Link to="/upload" style={navLinkStyle}>Upload</Link>
              <Link to="/platform-accounts" style={navLinkStyle}>Platforms</Link>
              <Link to="/infringements" style={navLinkStyle}>Infringement</Link>
            </>
          )}
        </nav>
      </header>

      {/* Banner */}
      <div style={bannerStyle}>
        <h1 style={mainTitleStyle}>速誅SUZOO!</h1>
        <h2 style={subTitleStyle}>侵權獵人系統</h2>
        {/* 如果尚未登入，才顯示[註冊 / 登入]按鈕 */}
        {!isLoggedIn && (
          <div style={{ marginTop:'1rem' }}>
            <Link to="/register" style={actionButtonStyle}>註冊</Link>
            <Link to="/login" style={actionButtonStyle}>登入</Link>
          </div>
        )}
      </div>

      {/* 內容區域 */}
      <main style={mainContentStyle}>
        <Outlet />
      </main>

      {/* 底部紀念文字 */}
      <footer style={footerStyle}>
        <div>
          為了紀念我最深愛的奶奶 曾李素珠小仙女 所開發<br/>
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            by 下輩子再當您孫子 凱
          </span>
        </div>
      </footer>
    </div>
  );
}
