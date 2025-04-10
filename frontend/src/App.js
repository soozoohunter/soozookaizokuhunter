// frontend/src/App.js
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

  // ===== Logout 處理 =====
  const handleLogout = () => {
    // 清除 Token
    localStorage.removeItem('token');
    // 重新導回首頁
    window.location.href = "/";
  };

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

  // ★「速誅 SUZOO!」/「侵權獵人系統」改為橘色
  const mainTitleStyle = {
    fontSize: '64px',
    fontWeight: 'bold',
    margin: '0.5rem 0',
    color: 'orange'  // ← 改成橘色
  };
  const subTitleStyle = {
    fontSize: '36px',
    fontFamily: '"KaiTi","DFKai-SB","serif"',
    margin: '0.5rem 0',
    color: 'orange'  // ← 改成橘色
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
  const featureTitleStyle = {
    color: 'dodgerblue',
    fontWeight: 'bold',
    margin: '0.8rem 0 0.5rem'
  };
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
              {/* 登出按鈕 */}
              <button onClick={() => {
                localStorage.removeItem('token');
                window.location.href = "/";
              }} style={{
                ...navLinkStyle,
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}>
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ====== Banner (只在首頁 & 未登入時顯示) ====== */}
      {(location.pathname === '/' && !isLoggedIn) && (
        <div style={bannerStyle}>
          <h1 style={mainTitleStyle}>速誅 SUZOO!</h1>
          <h2 style={subTitleStyle}>侵權獵人系統 (Copyright Hunter)</h2>

          <div style={actionBtnAreaStyle}>
            <Link to="/register" style={actionButtonStyle}>註冊</Link>
            <Link to="/login" style={actionButtonStyle}>登入</Link>
          </div>

          <div style={featuresContainerStyle}>
            <div style={featuresGridStyle}>
              {/* 左欄 */}
              <div style={colStyle}>
                <h3 style={featureTitleStyle}>
                  🔥 DCDV（動態著作 DNA）
                </h3>
                <ul style={{ margin:'0', padding:'0' }}>
                  <li style={bulletItemStyle}>
                    你的短影音 = 你的 DNA，每秒畫面皆是智慧財產
                  </li>
                  <li style={bulletItemStyle}>
                    區塊鏈 + AI 指紋辨識，證明原創
                  </li>
                </ul>

                <h3 style={featureTitleStyle}>
                  🔥 SCDV（靜態著作 DNA）
                </h3>
                <ul style={{ margin:'0', padding:'0' }}>
                  <li style={bulletItemStyle}>
                    圖片、插畫、攝影作品，專屬指紋哈希
                  </li>
                  <li style={bulletItemStyle}>
                    AI 圖片比對技術，防止未授權盜用
                  </li>
                </ul>

                <h3 style={featureTitleStyle}>
                  🔥 侵權通知（智慧警報）
                </h3>
                <ul style={{ margin:'0', padding:'0' }}>
                  <li style={bulletItemStyle}>
                    發現盜用，第一時間通知
                  </li>
                  <li style={bulletItemStyle}>
                    自動 DMCA，24 小時內下架
                  </li>
                </ul>
              </div>

              {/* 右欄 */}
              <div style={colStyle}>
                <h3 style={featureTitleStyle}>
                  🔥 區塊鏈存證（ETH 私有鏈）
                </h3>
                <ul style={{ margin:'0', padding:'0' }}>
                  <li style={bulletItemStyle}>
                    不可篡改證據，影片/圖片皆可存證
                  </li>
                </ul>

                <h3 style={featureTitleStyle}>
                  🔥 企業 API
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
                  🔥 ⚖️ 訴訟機制
                </h3>
                <ul style={{ margin:'0', padding:'0' }}>
                  <li style={bulletItemStyle}>
                    發現侵權後，可直接提告
                  </li>
                  <li style={bulletItemStyle}>
                    協助用戶訴訟
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要內容區 => <Outlet/> */}
      <main style={{ flex:1, padding:'1rem', margin:'0 1rem' }}>
        <Outlet />
      </main>

      {/* 底部紀念文字 */}
      <footer style={{
        textAlign:'center', padding:'1rem', marginTop:'auto',
        fontSize:'0.85rem', color:'#fff'
      }}>
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
