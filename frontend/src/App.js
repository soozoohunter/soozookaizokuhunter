import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function App() {
  // 讀取 localStorage token 判斷是否登入
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // 取得目前路由
  const location = useLocation();

  // 判斷是否在首頁路徑、且尚未登入 → 才顯示大區塊 (banner)
  const showBanner = (location.pathname === '/') && !isLoggedIn;

  // 登出按鈕
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = "/";
  };

  // =============================
  // Style
  // =============================
  const containerStyle = {
    backgroundColor: '#000',
    color: '#ff1c1c',
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
    padding: '1rem',
    background: '#111',
    borderBottom: '1px solid #f00'
  };
  const navLinkStyle = {
    marginRight: '1rem',
    color: '#ff1c1c',
    textDecoration: 'none',
    fontWeight: 'bold'
  };

  // Banner 區
  const bannerStyle = {
    textAlign: 'center',
    padding: '2rem',
    border: '2px solid #f00',
    margin: '1rem',
    borderRadius: '8px',
    background: 'rgba(255,28,28,0.06)'
  };

  // ★ 標題用橘色
  const mainTitleStyle = {
    fontSize: '64px',
    fontWeight: 'bold',
    margin: '0.5rem 0',
    color: 'orange'
  };
  const subTitleStyle = {
    fontSize: '36px',
    fontFamily: '"KaiTi","DFKai-SB","serif"',
    margin: '0.5rem 0',
    color: 'orange'
  };

  // 主內容
  const mainContentStyle = {
    flex: 1,
    padding: '1rem',
    margin: '0 1rem'
  };
  // 底部
  const footerStyle = {
    textAlign: 'center',
    padding: '1rem',
    marginTop: 'auto',
    fontSize: '0.85rem',
    color: '#fff'
  };

  return (
    <div style={containerStyle}>
      {/* 導覽列 */}
      <header style={headerStyle}>
        <div>
          <Link to="/" style={{ ...navLinkStyle, marginRight: '2rem' }}>
            速誅侵權獵人
          </Link>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
        </div>

        <nav>
          {!isLoggedIn && (
            <>
              <Link to="/login" style={navLinkStyle}>Login</Link>
              <Link to="/register" style={navLinkStyle}>Register</Link>
            </>
          )}
          {isLoggedIn && (
            <>
              <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
              <Link to="/upload" style={navLinkStyle}>Upload</Link>
              <Link to="/platform-accounts" style={navLinkStyle}>Platforms</Link>
              <Link to="/infringements" style={navLinkStyle}>Infringement</Link>
              <button
                onClick={handleLogout}
                style={{
                  ...navLinkStyle,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ====== Banner (只在首頁 & 未登入時顯示) ====== */}
      {showBanner && (
        <div style={bannerStyle}>
          <h1 style={mainTitleStyle}>速誅 SUZOO!</h1>
          <h2 style={subTitleStyle}>侵權獵人系統 (Copyright Hunter)</h2>
          {/* 移除重複的 DCDV / SCDV / 侵權通知介紹 → 不再放這裡 */}
        </div>
      )}

      {/* 主要內容 => <Outlet/> */}
      <main style={mainContentStyle}>
        <Outlet />
      </main>

      {/* 底部紀念文字 */}
      <footer style={footerStyle}>
        <div>
          為紀念我最深愛的 曾李素珠 阿嬤
          <br />
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            by Ka!KaiShield 凱盾
          </span>
        </div>
      </footer>
    </div>
  );
}
