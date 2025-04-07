import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n, t } = useTranslation();

  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  // -- 一些 inline style 變數，方便後面直接使用 --
  const containerStyle = {
    backgroundColor: '#000',    // 黑底
    color: '#f00',             // 紅字
    minHeight: '100vh',        // 佔滿整個瀏覽器視窗
    margin: 0,
    fontFamily: 'sans-serif',  // 可以換成您想要的字體
    display: 'flex',
    flexDirection: 'column'
  };

  // 頂部導覽列的 style
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem'
  };

  // 大字 Banner 區塊
  const bannerStyle = {
    textAlign: 'center',
    padding: '2rem',
    border: '2px solid #f00',   // 周圍來點紅色邊框，營造獵殺風格
    margin: '0 1rem'
  };

  // 速誅 (72px)
  const mainTitleStyle = {
    fontSize: '72px',
    fontWeight: 'bold',
    margin: '0.5rem 0'
  };

  // 侵權獵人系統 (48px)
  const subTitleStyle = {
    fontSize: '48px',
    fontWeight: 'normal',
    margin: '0.5rem 0'
  };

  // 中間 main 的 style
  const mainContentStyle = {
    flex: 1,         // 填滿剩餘空間
    padding: '1rem'
  };

  // footer style (紀念文字)
  const footerStyle = {
    fontSize: '16px',
    textAlign: 'center',
    padding: '1rem',
    marginTop: 'auto'
  };

  // 導覽列的連結樣式
  const navLinkStyle = {
    margin: '0 0.5rem',
    color: '#f00',
    textDecoration: 'none',
    fontWeight: 'bold'
  };

  // 語系切換按鈕 style
  const langBtnStyle = {
    marginLeft: '0.5rem',
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #f00',
    cursor: 'pointer'
  };

  // 註冊/登入 按鈕 style
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
          <Link to="/" style={navLinkStyle}>{t('siteTitle')}</Link>
          <Link to="/pricing" style={navLinkStyle}>{t('pricingTitle')}</Link>
          <Link to="/login" style={navLinkStyle}>{t('navLogin')}</Link>
          <Link to="/register" style={navLinkStyle}>{t('navRegister')}</Link>
          <Link to="/dashboard" style={navLinkStyle}>{t('navDashboard')}</Link>
          <Link to="/upload" style={navLinkStyle}>{t('navUpload')}</Link>
          <Link to="/platform-accounts" style={navLinkStyle}>{t('navPlatform')}</Link>
          <Link to="/infringements" style={navLinkStyle}>{t('navInfringement')}</Link>
          <Link to="/chain-test" style={navLinkStyle}>{t('navChainTest')}</Link>
        </nav>

        <div className="lang-switcher">
          {t('languageSwitcher')}:
          <button onClick={() => handleLangChange('zh')} style={langBtnStyle}>中</button>
          <button onClick={() => handleLangChange('en')} style={langBtnStyle}>EN</button>
          <button onClick={() => handleLangChange('ja')} style={langBtnStyle}>日</button>
        </div>
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

      {/* 中間主要內容 (Outlet) */}
      <main style={mainContentStyle}>
        <Outlet />
      </main>

      {/* 底部紀念文字 */}
      <footer style={footerStyle}>
        為了紀念我最深愛的奶奶 曾李素珠小仙女 開發
      </footer>
    </div>
  );
}

export default App;
