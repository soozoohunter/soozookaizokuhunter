// frontend/src/App.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function App() {
  // 讀取 localStorage token 判斷是否登入
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // =============================
  // 集中 style 設定
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

  // ★ 將「速誅 SUZOO!」改為亮紫色
  const mainTitleStyle = {
    fontSize: '64px',
    fontWeight: 'bold',
    margin: '0.5rem 0',
    color: 'violet'   // 新增這行，使標題呈現亮紫色
  };

  // ★ 將「侵權獵人系統」改為亮紫色（原本就有）
  const subTitleStyle = {
    fontSize: '36px',
    fontFamily: '"KaiTi","DFKai-SB","serif"',
    margin: '0.5rem 0',
    color: 'violet'
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

  // 「🔥 DCDV...」標題用亮藍色 / 其它特色標題亦可套用
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
        {/* 左側連結 */}
        <div>
          <Link to="/" style={{ ...navLinkStyle, marginRight: '2rem' }}>
            速誅侵權獵人
          </Link>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
        </div>

        {/* 右側連結 */}
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
        {/* 修改後：顯示亮紫色 */}
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
              <h3 style={featureTitleStyle}>
                🔥 DCDV（動態著作 DNA / Dynamic Content DNA Verification）
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  你的短影音 = 你的 DNA，每一秒畫面都是你的智慧財產
                </li>
                <li style={bulletItemStyle}>
                  區塊鏈 + AI 指紋辨識，即使被裁剪/變速/加字幕，也能證明原創
                </li>
              </ul>

              <h3 style={featureTitleStyle}>
                🔥 SCDV（靜態著作 DNA / Static Content DNA Verification）
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  圖片、插畫、攝影作品，擁有專屬指紋哈希
                </li>
                <li style={bulletItemStyle}>
                  AI 圖片比對技術，防止未授權盜用
                </li>
                <li style={bulletItemStyle}>
                  企業 API 整合，攝影師/插畫家可一鍵檢測
                </li>
              </ul>

              <h3 style={featureTitleStyle}>
                🔥 侵權通知（智慧警報 / Infringement Alert）
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  發現盜用，第一時間通知
                </li>
                <li style={bulletItemStyle}>
                  自動 DMCA 申訴，24 小時內下架
                </li>
              </ul>
            </div>

            {/* ===== 右欄 ===== */}
            <div style={colStyle}>
              <h3 style={featureTitleStyle}>
                🔥 區塊鏈存證（ETH 私有鏈 / Private Chain）
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  不可篡改證據，影片/圖片皆可存證
                </li>
                <li style={bulletItemStyle}>
                  讓作品擁有永續的原創證明
                </li>
              </ul>

              <h3 style={featureTitleStyle}>
                🔥 企業 API 服務 (Enterprise API)
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  大量監測品牌/攝影作品
                </li>
                <li style={bulletItemStyle}>
                  自動 DMCA / 板權維護
                </li>
              </ul>

              <h3 style={featureTitleStyle}>
                🔥 ⚖️ 訴訟機制 (Lawsuit Mechanism)
              </h3>
              <ul style={{ margin:'0', padding:'0' }}>
                <li style={bulletItemStyle}>
                  發現侵權後，可直接提告
                </li>
                <li style={bulletItemStyle}>
                  提供法律支援，協助用戶訴訟
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容區 => <Outlet/> */}
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
