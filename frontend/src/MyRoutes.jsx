/*************************************************************
 * MyRoutes.jsx
 * 最終整合版 React Router 設定檔，可整支覆蓋
 *************************************************************/
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// === 最外層 Layout (含 Navbar, Footer, <Outlet />) ===
import App from './App';

// === 各頁面 ===
import Home from './pages/Home';
import Login from './pages/Login';                 // 如若實際名稱是 LoginPage.jsx，請改為 import LoginPage from...
import Register from './pages/Register';           // 同理
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import PaymentPage from './pages/PaymentPage';
import PricingPage from './pages/PricingPage';
import TrademarkCheckPage from './pages/TrademarkCheckPage';
// 若還有其他頁面, 一併 import

export default function MyRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1) 將 App 作為最外層 Layout */}
        <Route path="/" element={<App />}>
          {/* 2) 透過 <Outlet> 顯示的子路由 */}
          <Route index element={<Home />} />

          <Route path="pricing" element={<PricingPage />} />

          {/* 登入 / 註冊 */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* 會員功能 */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="trademark-check" element={<TrademarkCheckPage />} />

          {/* 若有其他子路由，請在此新增 */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
