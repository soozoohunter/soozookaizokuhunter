// src/MyRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 外層 Layout (App)
import App from './App';

// 各子頁面 (若檔名或路徑不同，請依實際情況調整)
import Home from './pages/Home';         
import Login from './pages/Login';
import Register from './pages/Register';
import PricingPage from './pages/PricingPage';
import PaymentPage from './pages/PaymentPage';
// 如果需要 /upload、/dashboard 等，也可在此處引入
// import UploadPage from './pages/UploadPage';
// import Dashboard from './pages/Dashboard';

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

          {/* 若需要可再加 /upload, /dashboard, etc.
             <Route path="upload" element={<UploadPage />} /> 
             <Route path="dashboard" element={<Dashboard />} />
          */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
