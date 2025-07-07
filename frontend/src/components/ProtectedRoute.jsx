// frontend/src/components/ProtectedRoute.jsx (最終版)
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { AuthContext } from '../AuthContext';

/**
 * @param {Object} props
 * @param {string[]} props.allowedRoles - 允許存取此路由的角色陣列, e.g., ['user', 'admin']
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { token, logout } = useContext(AuthContext);

  if (!token) {
    const isAdminOnlyRoute = allowedRoles.includes('admin') && !allowedRoles.includes('user');
    const redirectPath = isAdminOnlyRoute ? '/admin/login' : '/login';
    return <Navigate to={redirectPath} replace />;
  }

  try {
    const decoded = jwt_decode(token);
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      // 權限不符，可以導向首頁或是一個「禁止存取」的頁面
      return <Navigate to="/" replace />;
    }
  } catch (err) {
    // Token 解析失敗（例如過期或格式錯誤），強制登出
    console.error('Invalid token, logging out.', err);
    logout(); // 清除壞的 token
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
