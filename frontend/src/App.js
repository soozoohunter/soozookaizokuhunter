// frontend/src/App.js
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function App() {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const location = useLocation();
  // 只在「未登入 && 首頁」顯示 Banner
  const showBanner = !isLoggedIn && location.pathname === '/';

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = "/";
  };

  const containerStyle = {
    backgroundColor: '#000',
    color: '#ff1c1c',
    minHeight: '100vh',
    margin: 0,
    fontFamily: 'sans-serif',
    display:'flex',
    flexDirection:'column'
  };
  const headerStyle = {
    display:'flex',
    justifyContent:'space-between',
    alignItems:'center',
    padding:'1rem',
    background:'#111',
    borderBottom:'1px solid #f00'
  };
  const navLinkStyle = {
    marginRight:'1rem',
    color:'#ff1c1c',
    textDecoration:'none',
    fontWeight:'bold'
  };

  // Banner
  const bannerStyle = {
    textAlign:'center',
    padding:'2rem',
    border:'2px solid #f00',
    margin:'1rem',
    borderRadius:'8px',
    background:'rgba(255,28,28,0.06)'
  };
  // 改為橘色
  const mainTitleStyle = {
    fontSize:'64px',
    fontWeight:'bold',
    margin:'0.5rem 0',
    color:'orange'
  };
  const subTitleStyle = {
    fontSize:'36px',
    fontFamily:'"KaiTi","DFKai-SB","serif"',
    margin:'0.5rem 0',
    color:'orange'
  };
  const mainContentStyle = {
    flex:1,
    padding:'1rem',
    margin:'0 1rem'
  };
  const footerStyle = {
    textAlign:'center',
    padding:'1rem',
    marginTop:'auto',
    fontSize:'0.85rem',
    color:'#fff'
  };

  return (
    <div style={containerStyle}>
      {/* 頂部導覽列 */}
      <header style={headerStyle}>
        <div>
          <Link to="/" style={{...navLinkStyle, marginRight:'2rem'}}>速誅侵權獵人</Link>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
          <Link to="/contact-us" style={navLinkStyle}>Contact Us</Link>
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
              <Link to="/profile" style={navLinkStyle}>會員中心</Link>
              <Link to="/upload" style={navLinkStyle}>Upload</Link>
              <button
                onClick={handleLogout}
                style={{
                  ...navLinkStyle,
                  background:'none',
                  border:'none',
                  cursor:'pointer'
                }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      {/* 首頁 Banner (未登入 && path === '/') */}
      {showBanner && (
        <div style={bannerStyle}>
          <h1 style={mainTitleStyle}>速誅 SUZOO!</h1>
          <h2 style={subTitleStyle}>侵權獵人系統</h2>
        </div>
      )}

      {/* 主內容：由 <Outlet/> 切換 */}
      <main style={mainContentStyle}>
        <Outlet />
      </main>

      {/* 底部紀念文字 */}
      <footer style={footerStyle}>
        <div>
          為紀念我最深愛的 曾李素珠 阿嬤
          <br/>
          <span style={{ fontSize:'0.8rem', opacity:0.85 }}>
            by Ka!KaiShield 凱盾
          </span>
        </div>
      </footer>
    </div>
  );
}
