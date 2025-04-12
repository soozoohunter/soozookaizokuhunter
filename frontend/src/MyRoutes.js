import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

// 頁面
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import ContactUsPage from './pages/ContactUsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import Dashboard from './pages/Dashboard';
import MembershipPage from './pages/MembershipPage';
import PlatformAccounts from './pages/PlatformAccounts';
import PaymentPage from './pages/PaymentPage';      // <-- 已新增
import TrademarkCheckPage from './pages/TrademarkCheckPage';

export default function MyRoutes(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="contact-us" element={<ContactUsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="platform-accounts" element={<PlatformAccounts />} />
          <Route path="payment" element={<PaymentPage />} />            {/* <-- 已新增 */}
          <Route path="trademark-check" element={<TrademarkCheckPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
