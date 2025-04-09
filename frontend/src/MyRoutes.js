// frontend/src/MyRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';            // 這裡改成純 Layout
import Home from './pages/Home';
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
      {/* 最外層 path="/" → 使用 <App> 作為 Layout */}
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
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
