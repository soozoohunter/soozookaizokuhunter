import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import InfringementList from './pages/InfringementList';
import PlatformAccounts from './pages/PlatformAccounts';
import Pricing from './pages/Pricing';
import './App.css';

function App() {
  const { i18n } = useTranslation();

  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <BrowserRouter>
      <nav style={{ display:'flex', gap:'1rem', background:'#ddd', padding:'0.5rem' }}>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/infringements">My Infringements</Link>
        <Link to="/profile/accounts">My Platforms</Link>
        <Link to="/pricing">Pricing</Link>

        <div style={{ marginLeft:'auto' }}>
          <button onClick={()=>changeLang('zh')}>中</button>
          <button onClick={()=>changeLang('en')}>EN</button>
          <button onClick={()=>changeLang('ja')}>日</button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/infringements" element={<InfringementList />} />
        <Route path="/profile/accounts" element={<PlatformAccounts />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
