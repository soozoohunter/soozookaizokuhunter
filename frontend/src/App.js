// frontend/src/App.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function App() {
  // 讀取 Token，判斷是否登入
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // -- style 集中放這裡 --
  const containerStyle = {
    backgroundColor: '#000',
    color: '#ff1c1c',
    minHeight: '100vh',
    margin: 0,
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column'
  };

  // 導覽列
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: '#111',            // 導覽列背景
    borderBottom: '1px solid #f00'
  };

  const navLinkStyle = {
    marginRight: '1rem',
    color: '#ff1c1c',
    textDecoration: 'none',
    fontWeight: 'bold'
  };

  const bannerStyle = {
    textAlign: 'center',
    padding: '2rem',
    border: '2px solid #f00',
    margin: '1rem',
    borderRadius: '8px',
    background: 'rgba(255,28,28,0.06)'
  };

  const mainTitleStyle = {
    fontSize: '64px',
    fontWeight: 'bold',
    margin: '0.5rem 0'
  };

  const subTitleStyle = {
    fontSize: '36px',
    fontFamily: '"KaiTi","DFKai-SB","serif"',
    margin: '0.5rem 0'
  };

  const actionBtnAreaStyle = {
    marginTop: '1rem'
  };

  const actionButtonStyle = {
    margin: '0 0.5rem',
    fontSize: '1.2rem',
    backgroundColor: '#ff1c1c',
    color: '#fff',
    padding: '0.5rem 1rem',
    textDecoration: 'none',
    borderRadius: '4px',
    border: 'none'
  };

  const mainContentStyle = {
    flex: 1,
    padding: '1rem',
    margin: '0 1rem'
  };

  const footerStyle = {
    textAlign: 'center',
    padding: '1rem',
    marginTop: 'auto',
    fontSize: '0.85rem',
    color: '#fff'
  };

  // 介紹功能: 用於在 Banner 下方顯示您貼的介紹文字
  const featuresContainerStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #f00',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem',
    lineHeight: '1.6'
  };

  const featureTitleStyle = {
    color: '#ff1c1c',
    fontWeight: 'bold',
    margin: '0.5rem 0'
  };

  const bulletItemStyle = {
    marginLeft: '1.8rem' // 讓 🔹 序號往內一點
  };

  return (
    <div style={containerStyle}>

      {/* 導覽列 */}
      <header style={headerStyle}>
        <div>
          {/* 左邊 LOGO 或主連結 */}
          <Link to="/" style={{ ...navLinkStyle, marginRight:'2rem' }}>
            速誅侵權獵人
          </Link>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
        </div>

        <nav>
          {/* 未登入 => 顯示 Login / Register */}
          {!isLoggedIn && (
            <>
              <Link to="/login" style={navLinkStyle}>Login</Link>
              <Link to="/register" style={navLinkStyle}>Register</Link>
            </>
          )}
          {/* 已登入 => 顯示 Dashboard / Upload / Platforms / Infringement */}
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

      {/* Banner 區塊 */}
      <div style={bannerStyle}>
        <h1 style={mainTitleStyle}>速誅SUZOO!</h1>
        <h2 style={subTitleStyle}>侵權獵人系統</h2>

        {/* 如果尚未登入, 才顯示 [註冊 / 登入] */}
        {!isLoggedIn && (
          <div style={actionBtnAreaStyle}>
            <Link to="/register" style={actionButtonStyle}>註冊</Link>
            <Link to="/login" style={actionButtonStyle}>登入</Link>
          </div>
        )}

        {/* === 新增: "介紹功能" 文字區塊 === */}
        <div style={featuresContainerStyle}>

          <h3 style={featureTitleStyle}>🔥 DCDV（動態著作 DNA 辨識）</h3>
          <ul style={{ margin:'0', padding:'0' }}>
            <li style={bulletItemStyle}>
              你的短影音 = 你的 DNA，每一秒畫面都是你的智慧財產
            </li>
            <li style={bulletItemStyle}>
              透過 區塊鏈技術 + AI 指紋辨識，
              即使被裁剪、變速、加字幕，仍然可以 100% 精準比對，證明你是原創者！
            </li>
          </ul>

          <h3 style={featureTitleStyle}>🔥 SCDV（靜態著作 DNA 辨識）</h3>
          <ul style={{ margin:'0', padding:'0' }}>
            <li style={bulletItemStyle}>
              圖片、插畫、攝影作品，擁有專屬的著作 DNA！
            </li>
            <li style={bulletItemStyle}>
              AI 圖片指紋比對技術，確保你的作品不被盜用！
            </li>
            <li style={bulletItemStyle}>
              企業 API 整合，品牌、攝影師可一鍵監測未授權使用！
            </li>
          </ul>

          <h3 style={featureTitleStyle}>🔥 侵權通知（智慧警報系統）</h3>
          <ul style={{ margin:'0', padding:'0' }}>
            <li style={bulletItemStyle}>
              你的作品被偷了？我們第一時間通知你！
            </li>
            <li style={bulletItemStyle}>
              自動提交 DMCA 申訴，讓盜版內容 24 小時內下架！
            </li>
            <li style={bulletItemStyle}>
              不用花時間檢舉，系統全自動幫你維權！
            </li>
          </ul>

          <h3 style={featureTitleStyle}>🔥 區塊鏈存證（ETH 私有鏈）</h3>
          <ul style={{ margin:'0', padding:'0' }}>
            <li style={bulletItemStyle}>
              你的創作，將擁有不可篡改的證據！
            </li>
            <li style={bulletItemStyle}>
              無論是影片、圖片、圖文，都能被存證於區塊鏈，確保歸屬！
            </li>
          </ul>

          <h3 style={featureTitleStyle}>🔥 企業 API 服務（侵權監測 / DMCA 自動申訴）</h3>
          <ul style={{ margin:'0', padding:'0' }}>
            <li style={bulletItemStyle}>
              給企業級客戶專屬的智能內容監測工具
            </li>
            <li style={bulletItemStyle}>
              可批量監測品牌內容的未授權使用
            </li>
            <li style={bulletItemStyle}>
              讓企業在數位時代，輕鬆維護智慧財產權！
            </li>
          </ul>

          <h3 style={featureTitleStyle}> ⚖️ 訴訟機制（讓侵權者付出代價！）</h3>
          <ul style={{ margin:'0', padding:'0' }}>
            <li style={bulletItemStyle}>
              侵權通報後，還能直接發起訴訟！
            </li>
            <li style={bulletItemStyle}>
              KaiKa! 提供法律支援，協助用戶對侵權者提告
            </li>
          </ul>

        </div>
      </div>

      {/* 主內容區 (放 <Outlet/>) */}
      <main style={mainContentStyle}>
        <Outlet />
      </main>

      {/* 底部紀念文字 */}
      <footer style={footerStyle}>
        <div>
          為了紀念我最深愛的奶奶 曾李素珠小仙女 <br/>
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            by Ka!KaiShield 凱盾
          </span>
        </div>
      </footer>
    </div>
  );
}
