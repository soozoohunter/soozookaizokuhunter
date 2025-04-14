import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import PaymentPage from './pages/PaymentPage';
import PricingPage from './pages/PricingPage';
import TrademarkCheckPage from './pages/TrademarkCheckPage';
// ... 其他頁面

export default function MyRoutes(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="trademark-check" element={<TrademarkCheckPage />} />
          {/* 其他路由 */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
