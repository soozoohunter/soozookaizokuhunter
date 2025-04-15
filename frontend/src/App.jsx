import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import './App.css';  // 全域樣式檔，設定黑橘主題

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 首頁 */}
        <Route path="/" element={<Home />} />
        {/* 註冊頁面 */}
        <Route path="/register" element={<Register />} />
        {/* 登入頁面 */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
