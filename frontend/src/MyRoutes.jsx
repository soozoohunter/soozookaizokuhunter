// frontend/src/MyRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 外層 Layout (App)
import App from './App';

// 各子頁面
import Home from './pages/Home';         
import Login from './pages/Login';
import Register from './pages/Register';
import PricingPage from './pages/PricingPage';
import PaymentPage from './pages/PaymentPage';

// Admin 頁面
import AdminDashboard from './pages/AdminDashboard';

export default function MyRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 最外層路由：使用 <App /> 作為 Layout */}
        <Route path="/" element={<App />}>
          {/* index -> 根路徑顯示 Home */}
          <Route index element={<Home />} />

          {/* 已定義的子頁面： /login, /register, /pricing, /payment */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="payment" element={<PaymentPage />} />

          {/* 管理員頁面: /admin */}
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
