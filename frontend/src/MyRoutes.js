// frontend/src/MyRoutes.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

import Home from './pages/Home';
import Pricing from './pages/Pricing';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import ContactUsPage from './pages/ContactUsPage';

export default function MyRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* App為Layout */}
        <Route path="/" element={<App />}>
          {/* 首頁 */}
          <Route index element={<Home />} />

          {/* Pricing / Contact Us */}
          <Route path="pricing" element={<Pricing />} />
          <Route path="contact-us" element={<ContactUsPage />} />

          {/* Auth */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Profile / Upload */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="upload" element={<UploadPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
