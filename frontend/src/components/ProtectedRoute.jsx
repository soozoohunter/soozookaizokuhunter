// frontend/src/components/ProtectedRoute.jsx (最終版)
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from '../AuthContext';

/**
 * @param {Object} props
 * @param {string[]} props.allowedRoles - 允許存取此路由的角色陣列, e.g., ['user', 'admin']
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { token, logout } = useContext(AuthContext);

  if (!token) {
    // 根據目標路由決定要跳轉到哪個登入頁
    const isAdminOnlyRoute = allowedRoles.includes('admin') && !allowedRoles.includes('user');
    const redirectPath = isAdminOnlyRoute ? '/admin/login' : '/login';
    return <Navigate to={redirectPath} replace />;
  }

  try {
    const decoded = jwtDecode(token);
    // 如果路由有權限限制，且使用者的角色不在允許清單內，則導向首頁
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return <Navigate to="/" replace />;
    }
  } catch (err) {
    // Token 解析失敗（例如過期或格式錯誤），強制登出
    console.error('Invalid token, logging out.', err);
    logout(); // 清除壞的 token
    return <Navigate to="/login" replace />;
  }

  // 驗證通過，渲染子路由
  return <Outlet />;
}
