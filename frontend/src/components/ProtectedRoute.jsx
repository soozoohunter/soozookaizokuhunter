// frontend/src/components/ProtectedRoute.jsx (最終版)
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import styled from 'styled-components';

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background-color: #fff;
  color: #0A0101;
  font-family: 'Manrope', 'Roboto', sans-serif;
`;

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingWrapper><h1>Verifying Session...</h1></LoadingWrapper>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
