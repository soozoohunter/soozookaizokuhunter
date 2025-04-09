// frontend/src/MyRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';               // 新增 Home
import Pricing from './pages/Pricing';         // 新增 Pricing
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import PlatformAccounts from './pages/PlatformAccounts';
import InfringementList from './pages/InfringementList';

export default function MyRoutes() {
  return (
    <Routes>
      {/* 最外層 path="/" → 使用 <App> 作為 Layout */}
      <Route path="/" element={<App />}>
        {/* 首頁: "/" */}
        <Route index element={<Home />} />

        {/* Pricing */}
        <Route path="pricing" element={<Pricing />} />

        {/* Login / Register */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Dashboard, Upload, ... 僅登入後可用(前端不做完全擋) */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="platform-accounts" element={<PlatformAccounts />} />
        <Route path="infringements" element={<InfringementList />} />
      </Route>
    </Routes>
  );
}
