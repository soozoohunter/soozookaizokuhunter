// frontend/src/index.js (或您實際的路由檔)

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UploadPage from './pages/UploadPage';
import Dashboard from './pages/Dashboard'; // ← 將原本的 DashboardPage 替換為 Dashboard

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          {/* 首頁 (App Banner) */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="dashboard" element={<Dashboard />} /> {/* ← 使用 Dashboard */}
          {/* etc. */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
