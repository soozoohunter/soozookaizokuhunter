import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App'; 
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import PlatformAccounts from './pages/PlatformAccounts';
import InfringementList from './pages/InfringementList';

export default function MyRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 最外層 path="/" → 使用 <App> 作為 Layout */}
        <Route path="/" element={<App />}>
          {/* 首頁: "/" → index */}
          <Route index element={<Home />} />

          {/* Pricing */}
          <Route path="pricing" element={<Pricing />} />

          {/* Login / Register */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* 其他頁面 */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="platform-accounts" element={<PlatformAccounts />} />
          <Route path="infringements" element={<InfringementList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
