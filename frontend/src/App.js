// frontend/src/App.js
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet
} from 'react-router-dom';

// ★ Import 您的各個頁面（若檔名不同，請對應更改）
//   若有些檔案您沒有，請刪除那條 import 與對應 <Route>
import Home from './pages/Home'; 
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import Upload from './pages/Upload';
import PlatformAccounts from './pages/PlatformAccounts';
import InfringementList from './pages/InfringementList';

// 這個 BannerLayout 會套用黑底+紅字風格，以及 <Outlet/> 來顯示子頁面
function BannerLayout() {
  // -- Inline style 變數 --
  const containerStyle = {
    backgroundColor: '#000', // 黑底
    color: '#f00',           // 紅字
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
    padding: '1rem'
  };

  const bannerStyle = {
    textAlign: 'center',
    padding: '2rem',
    border: '2px solid #f00',
    margin: '0 1rem'
  };

  const mainTitleStyle = {
    fontSize: '72px',
    fontWeight: 'bold',
    margin: '0.5rem 0'
  };

  const subTitleStyle = {
    fontSize: '48px',
    fontWeight: 'normal',
    margin: '0.5rem 0'
  };

  const mainContentStyle = {
    flex: 1,
    padding: '1rem'
  };

  const footerStyle = {
    fontSize: '16px',
    textAlign: 'center',
    padding: '1rem',
    marginTop: 'auto'
  };

  const navLinkStyle = {
    margin: '0 0.5rem',
    color: '#f00',
    textDecoration: 'none',
    fontWeight: 'bold'
  };

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
          <Link to="/" style={navLinkStyle}>速誅侵權獵人</Link>
          <Link to="/pricing" style={navLinkStyle}>Pricing</Link>
          <Link to="/login" style={navLinkStyle}>Login</Link>
          <Link to="/register" style={navLinkStyle}>Register</Link>
          <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
          <Link to="/upload" style={navLinkStyle}>Upload</Link>
          <Link to="/platform-accounts" style={navLinkStyle}>Platforms</Link>
          <Link to="/infringements" style={navLinkStyle}>Infringement</Link>
        </nav>
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
        {/* ★ 這裡顯示子頁的內容，如 Home, Dashboard, etc */}
        <Outlet />
      </main>

      {/* 底部紀念文字 */}
      <footer style={footerStyle}>
        為了紀念我最深愛的奶奶 曾李素珠小仙女 開發
      </footer>
    </div>
  );
}

// 最外層 App：使用 BrowserRouter + Routes + Route 配置
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* path="/" 使用 BannerLayout，並在 Outlet 放子路由 */}
        <Route path="/" element={<BannerLayout />}>
          {/* index -> / */}
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="upload" element={<Upload />} />
          <Route path="platform-accounts" element={<PlatformAccounts />} />
          <Route path="infringements" element={<InfringementList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
