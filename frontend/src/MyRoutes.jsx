// frontend/src/MyRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 版型佈局
import App from './App';

// 各頁面
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PricingPage from './pages/PricingPage';
import PaymentPage from './pages/PaymentPage';
// ... 若有 Dashboard, Profile, Upload 也在此匯入

export default function MyRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 最外層路由：使用 <App /> 作為 layout */}
        <Route path="/" element={<App />}>
          {/* 子路由，會在 <Outlet /> 呈現 */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="payment" element={<PaymentPage />} />
          {/* 其他例如 */}
          {/* <Route path="dashboard" element={<Dashboard />} /> */}
          {/* <Route path="profile" element={<ProfilePage />} /> */}
          {/* <Route path="upload" element={<UploadPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
