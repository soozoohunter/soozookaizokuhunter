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

  return (
    <div style={containerStyle}>
      {/* ======== 頂部導覽列 ======== */}
      <header style={headerStyle}>
        {/* 左側：改成明顯按鈕 */}
        <button
          onClick={()=> window.location.href='/'}
          style={{
            background:'none',
            border:'2px solid #ff1c1c',
            borderRadius:'4px',
            color:'#ff1c1c',
            padding:'6px 12px',
            marginRight:'2rem',
            cursor:'pointer',
            fontWeight:'bold'
          }}
        >
          速誅侵權獵人
        </button>

        {/* 右側：導航連結 */}
        <nav>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
          <Link to="/contact-us" style={navLinkStyle}>Contact Us</Link>

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

      {/* ======== 首頁大紅框 Banner ======== */}
      {showBanner && (
        <div style={bannerStyle}>
          {/* 第一行：橘色 */}
          <h1 style={{ 
            fontSize:'64px', 
            fontWeight:'bold', 
            margin:'0.5rem 0', 
            color:'orange' 
          }}>
            速誅侵權獵人
          </h1>
          {/* 第二行：再紅一點 #ff5500 */}
          <h2 style={{ 
            fontSize:'36px', 
            margin:'0.5rem 0', 
            color:'#ff5500' 
          }}>
            SUZOO!KAIZOKU HUNTER SYSTEM
          </h2>
        </div>
      )}

      {/* ======== 主內容區: 由 <Outlet /> 插入 ======== */}
      <main style={{ flex:1, padding:'1rem', margin:'0 1rem' }}>
        <Outlet />
      </main>

      {/* ======== 頁尾紀念文字 ======== */}
      <footer style={{
        textAlign:'center',
        padding:'1rem',
        marginTop:'auto',
        fontSize:'0.85rem',
        color:'#fff'
      }}>
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
