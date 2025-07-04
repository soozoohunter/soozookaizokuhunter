import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { AuthContext } from '../AuthContext';

/**
 * Route guard component supporting role-based protection.
 *
 * @param {Object} props
 * @param {('user'|'admin')} [props.role] - Required user role.
 */
export default function ProtectedRoute({ role }) {
  const { token } = useContext(AuthContext);

  if (!token) {
    // 未登入 → 依角色導向對應登入頁
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  }

  if (role) {
    try {
      const decoded = jwt_decode(token);
      if (decoded.role !== role) {
        // 角色不符 → 導向首頁
        return <Navigate to="/" replace />;
      }
    } catch (err) {
      console.error('Invalid token decode', err);
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}
