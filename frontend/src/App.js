import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function App() {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const location = useLocation();
  // 只在「未登入 && 首頁」顯示 Banner
  const showBanner = (!isLoggedIn && location.pathname === '/');

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = "/";
  };

  // 容器
  const containerStyle = {
    backgroundColor: '#000',
    color: '#ff1c1c',
    minHeight: '100vh',
    margin: 0,
    fontFamily: 'sans-serif',
    display:'flex',
    flexDirection:'column'
  };

  // 頂部導覽列
  const headerStyle = {
    display:'flex',
    justifyContent:'space-between',
    alignItems:'center',
    padding:'1rem',
    background:'#111',
    borderBottom:'1px solid #f00'
  };

  // 導覽列按鈕 (包含左側 & 右側)
  const navBtnStyle = {
    background:'none',
    border:'2px solid orange',    // 外框改成橘色
    borderRadius:'4px',
    color:'orange',               // 文字也改橘
    padding:'6px 12px',
    marginRight:'1rem',
    cursor:'pointer',
    fontWeight:'bold',
    textDecoration:'none'
  };

  // 首頁 Banner
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
      {/* ======= 頂部導覽列 ======= */}
      <header style={headerStyle}>
        {/* 左側：改為「橘色」按鈕 */}
        <button
          onClick={()=> window.location.href='/'}
          style={{
            ...navBtnStyle,
            marginRight:'2rem',
          }}
        >
          速誅侵權獵人
        </button>

        {/* 右側：連結與按鈕 */}
        <nav style={{ display:'flex', alignItems:'center' }}>
          {/* Pricing */}
          <Link to="/pricing" style={navBtnStyle}>
            Pricing
          </Link>
          {/* Contact Us */}
          <Link to="/contact-us" style={navBtnStyle}>
            Contact Us
          </Link>

          {!isLoggedIn && (
            <>
              <Link to="/login" style={navBtnStyle}>Login</Link>
              <Link to="/register" style={navBtnStyle}>Register</Link>
            </>
          )}
          {isLoggedIn && (
            <>
              <Link to="/profile" style={navBtnStyle}>會員中心</Link>
              <Link to="/upload" style={navBtnStyle}>Upload</Link>
              <button
                onClick={handleLogout}
                style={{
                  ...navBtnStyle,
                  border:'none', // 或者維持邊框：看你需求
                }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ======= 首頁 Banner ======= */}
      {showBanner && (
        <div style={bannerStyle}>
          <h1 style={{
            fontSize:'64px',
            fontWeight:'bold',
            margin:'0.5rem 0',
            color:'orange'
          }}>
            速誅侵權獵人
          </h1>
          <h2 style={{
            fontSize:'36px',
            margin:'0.5rem 0',
            color:'#ff5500'
          }}>
            SUZOO!KAIZOKU HUNTER SYSTEM
          </h2>
        </div>
      )}

      {/* ======= 主內容 ======= */}
      <main style={{ flex:1, padding:'1rem', margin:'0 1rem' }}>
        <Outlet />
      </main>

      {/* ======= 頁尾紀念文字 ======= */}
      <footer style={{
        textAlign:'center',
        padding:'1rem',
        marginTop:'auto',
        fontSize:'0.85rem',
        color:'#fff'
      }}>
        <div>
          為紀念我最深愛的 曾李素珠 阿嬤
          <br />
          <span style={{ fontSize:'0.8rem', opacity:0.85 }}>
            by Ka!KaiShield 凱盾
          </span>
        </div>
      </footer>
    </div>
  );
}
