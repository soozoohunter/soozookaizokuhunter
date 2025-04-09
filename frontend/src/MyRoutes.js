// frontend/src/MyRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import Upload from './pages/Upload';
import PlatformAccounts from './pages/PlatformAccounts';
import InfringementList from './pages/InfringementList';

// 匯入我們剛剛新增的 ProtectedRoute
import ProtectedRoute from './ProtectedRoute';

export default function MyRoutes() {
  return (
    <Routes>
      {/* 最外層 path="/" → 使用 <App> 作為 Layout */}
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="pricing" element={<Pricing />} />

        {/* 不需登入之頁面 */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<RegisterPage />} />

        {/* 需要登入之頁面 → 用 ProtectedRoute 包 */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="platform-accounts"
          element={
            <ProtectedRoute>
              <PlatformAccounts />
            </ProtectedRoute>
          }
        />
        <Route
          path="infringements"
          element={
            <ProtectedRoute>
              <InfringementList />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
