// frontend/src/MyRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';            // 您目前的 App.js
import Home from './pages/Home';    // 例：首頁
import Dashboard from './pages/Dashboard';
// ... 其他頁面

/**
 * 此檔案的作用：
 * 1. 用 <Routes> 包住各 <Route> 
 * 2. 將 "/" 對應到 <App> (含 <Outlet/>)，
 *    再在 <App> 的 <Outlet/> 之下顯示實際頁面
 */
export default function MyRoutes() {
  return (
    <Routes>
      {/* 最外層 route */}
      <Route path="/" element={<App />}>
        {/* <App/> 裏面有 <Outlet/>，所以在此之下再放子路由 */}
        
        {/* index 表示 path="/" */}
        <Route index element={<Home />} />

        {/* 例如 /dashboard */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* 這裡您也可以放 
            /pricing, /login, /register, /upload... */}
        {/* 例如：<Route path="upload" element={<Upload />} /> */}
      </Route>
    </Routes>
  );
}
