// frontend/src/MyRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// ====== 以下 import 請確保對應檔案存在 ======
import App from './App';               // 最外層 Layout (含 <Outlet />)
import Home from './pages/Home';       // 首頁
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import Upload from './pages/Upload';
import PlatformAccounts from './pages/PlatformAccounts';
import InfringementList from './pages/InfringementList';

export default function MyRoutes() {
  return (
    <Routes>
      {/*
        根路徑 "/" 使用 <App> 作為整體佈局，
        <App> 內含 <Outlet>，讓子路徑對應至子頁。
      */}
      <Route path="/" element={<App />}>
        {/* index => "/" => 渲染 <Home /> */}
        <Route index element={<Home />} />

        {/* 其它子路徑 */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="upload" element={<Upload />} />
        <Route path="platform-accounts" element={<PlatformAccounts />} />
        <Route path="infringements" element={<InfringementList />} />
      </Route>
    </Routes>
  );
}
