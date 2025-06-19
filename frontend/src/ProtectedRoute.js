// frontend/src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from './api/authService';

export default function ProtectedRoute({ children }) {
  // 假設用 localStorage.getItem('token') 判斷是否登入
  const token = authService.getAccessToken();

  if (!token) {
    // 尚未登入 → 導向 /login
    alert('請先登入！');
    return <Navigate to="/login" replace />;
  }

  // 已登入 → 顯示原本子頁面
  return children;
}
