// frontend/src/components/ProtectedRoute.jsx (最終版)
import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

/**
 * @param {Object} props
 * @param {string[]} props.allowedRoles - 允許存取此路由的角色陣列, e.g., ['user', 'admin']
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAuthorized = allowedRoles.includes(user?.role);

  if (!isAuthorized) {
    alert('您的權限不足，無法訪問此頁面。');
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
