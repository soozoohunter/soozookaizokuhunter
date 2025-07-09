import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 外層 Layout (App)
import App from './App';

// 各子頁面
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PricingPage from './pages/PricingPage';
import PaymentPage from './pages/PaymentPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ContactPage from './pages/ContactPage'; // ★ 新增

export default function MyRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 最外層路由：使用 <App /> 作為 Layout */}
        <Route path="/" element={<App />}>
          {/* index -> 根路徑顯示 Home */}
          <Route index element={<HomePage />} />

          {/* 已定義的子頁面： /login, /register, /pricing, /payment */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="payment" element={<PaymentPage />} />

          {/* 新增 Contact Us 路由：/contact */}
          <Route path="contact" element={<ContactPage />} />

          {/* 管理員頁面: /admin (若您想要 /admin/dashboard，也可以在此再做細分) */}
          <Route path="admin" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
