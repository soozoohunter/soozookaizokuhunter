import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n, t } = useTranslation();

  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div>
      <header className="navbar">
        {/*
          已移除原本 <div className="nav-logo"> ... </div>
          若想只刪除名稱「Logo」而保留 <Link>，可直接改成下列示範
          此處範例直接整塊刪除 .nav-logo 區段
        */}

        <nav className="nav-links">
          <Link to="/">{t('siteTitle')}</Link>
          <Link to="/pricing">{t('pricingTitle')}</Link>
          <Link to="/login">{t('navLogin')}</Link>
          <Link to="/register">{t('navRegister')}</Link>
          <Link to="/dashboard">{t('navDashboard')}</Link>
          <Link to="/upload">{t('navUpload')}</Link>
          <Link to="/platform-accounts">{t('navPlatform')}</Link>
          <Link to="/infringements">{t('navInfringement')}</Link>
          <Link to="/chain-test">{t('navChainTest')}</Link>
        </nav>

        <div className="lang-switcher">
          {t('languageSwitcher')}:
          <button onClick={() => handleLangChange('zh')}>中</button>
          <button onClick={() => handleLangChange('en')}>EN</button>
          <button onClick={() => handleLangChange('ja')}>日</button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
