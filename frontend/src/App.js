// frontend/src/App.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function App() {
  // 讀取 token 判斷是否登入
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  /* =============================
     一些集中 style 設定
     ============================= */
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
    background: '#111',
    borderBottom: '1px solid #f00'
  };
  const navLinkStyle = {
    marginRight: '1rem',
    color: '#ff1c1c',
    textDecoration: 'none',
    fontWeight: 'bold'
  };

  // Banner 主區
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
  const actionBtnAreaStyle = { marginTop: '1rem' };
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

  // 主內容
  const mainContentStyle = {
    flex: 1,
    padding: '1rem',
    margin: '0 1rem'
  };

  // 底部紀念文字
  const footerStyle = {
    textAlign: 'center',
    padding: '1rem',
    marginTop: 'auto',
    fontSize: '0.85rem',
    color: '#fff'
  };

  // 介紹外容器
  const featuresContainerStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #f00',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem',
    lineHeight: '1.6'
  };

  // 兩欄排版：左右欄對稱
  const featuresGridStyle = {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    marginTop: '1rem'
  };
  const colStyle = {
    flex: '1',
    minWidth: '280px'
  };

  // 「🔥 DCDV...」標題顏色改用亮藍色
  const featureTitleStyle = {
    color: 'dodgerblue',
    fontWeight: 'bold',
    margin: '0.8rem 0 0.5rem'
  };

  // bullet list
  const bulletItemStyle = {
    marginLeft: '1.6rem',
    marginBottom: '0.5rem',
    color: '#eee'
  };

  return (
    <div style={containerStyle}>

      {/* ====== 導覽列 ====== */}
      <header style={headerStyle}>
        <div>
          <Link to="/" style={{ ...navLinkStyle, marginRight: '2rem' }}>
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
          {/* 已登入 => 顯示 Dashboard / Upload / Platform / Infringement */}
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

      {/* ====== Banner ====== */}
      <div style={bannerStyle}>
        <h1 style={mainTitleStyle}>速誅 SUZOO!</h1>
        <h2 style={subTitleStyle}>侵權獵人系統 (Copyright Hunter System)</h2>

        {/* 未登入才顯示 [註冊 / 登入] 按鈕 */}
        {!isLoggedIn && (
          <div style={actionBtnAreaStyle}>
            <Link to="/register" style={actionButtonStyle}>註冊</Link>
            <Link to="/login" style={actionButtonStyle}>登入</Link>
          </div>
        )}

        {/* ====== 介紹功能區塊 (左右兩欄) ====== */}
        <div style={featuresContainerStyle}>

          <div style={featuresGridStyle}>

            {/* ===== 左欄 ===== */}
            <div style={colStyle}>
              {/* DCDV */}
              <h3 style={featureTitleStyle}>
                🔥 DCDV（動態著作 DNA 辨識 / Dynamic Content DNA Verification）
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  你的短影音 = 你的 DNA，每一秒畫面都是你的智慧財產
                </li>
                <li style={bulletItemStyle}>
                  透過區塊鏈技術 + AI 指紋辨識，
                  即使被裁剪、變速、加字幕，仍能精準比對，證明你是原創者
                </li>
              </ul>

              {/* SCDV */}
              <h3 style={featureTitleStyle}>
                🔥 SCDV（靜態著作 DNA 辨識 / Static Content DNA Verification）
              </h3>
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

              {/* 侵權通知 */}
              <h3 style={featureTitleStyle}>
                🔥 侵權通知（智慧警報系統 / Infringement Alert System）
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  你的作品被偷了？我們第一時間通知你！
                </li>
                <li style={bulletItemStyle}>
                  自動提交 DMCA 申訴，盜版內容 24 小時內下架
                </li>
                <li style={bulletItemStyle}>
                  不用花時間檢舉，系統全自動幫你維權！
                </li>
              </ul>
            </div>

            {/* ===== 右欄 ===== */}
            <div style={colStyle}>
              {/* 區塊鏈存證 */}
              <h3 style={featureTitleStyle}>
                🔥 區塊鏈存證（ETH 私有鏈 / ETH Private Chain）
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  你的創作擁有不可篡改的證據
                </li>
                <li style={bulletItemStyle}>
                  影片、圖片、圖文，都能存證於區塊鏈
                </li>
              </ul>

              {/* 企業 API 服務 */}
              <h3 style={featureTitleStyle}>
                🔥 企業 API 服務 (Enterprise API Services)
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  專屬的內容監測工具，批量偵測未授權使用
                </li>
                <li style={bulletItemStyle}>
                  自動 DMCA 申訴，維護品牌版權
                </li>
              </ul>

              {/* 訴訟機制 */}
              <h3 style={featureTitleStyle}>
                🔥 ⚖️ 訴訟機制 (Lawsuit Mechanism)
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  侵權通報後，可直接發起訴訟
                </li>
                <li style={bulletItemStyle}>
                  KaiKaiShield 提供法律支援，協助提告
                </li>
              </ul>
            </div>

          </div>
        </div>{/* end featuresContainer */}
      </div>{/* end banner */}

      {/* 主要內容區 => <Outlet/> */}
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
