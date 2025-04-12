// frontend/src/MyRoutes.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

// 頁面
import Home from './pages/Home';
import ContactUsPage from './pages/ContactUsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';    // <-- 新增
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import Dashboard from './pages/Dashboard';
import MembershipPage from './pages/MembershipPage';
import PlatformAccounts from './pages/PlatformAccounts';
import PaymentPage from './pages/PaymentPage';
import TrademarkCheckPage from './pages/TrademarkCheckPage';

// PricingPage (英文版方案介紹)
import PricingPage from './pages/PricingPage';       // <-- 新增

export default function MyRoutes(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          {/* 首頁 */}
          <Route index element={<Home />} />

          {/* Pricing 頁 (英文介紹) */}
          <Route path="pricing" element={<PricingPage />} />

          {/* 其他既有頁面 */}
          <Route path="contact-us" element={<ContactUsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} /> 
          <Route path="profile" element={<ProfilePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="platform-accounts" element={<PlatformAccounts />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="trademark-check" element={<TrademarkCheckPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
