import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import styled from 'styled-components';

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.dark.background};
  color: ${({ theme }) => theme.colors.dark.text};
  font-family: ${({ theme }) => theme.fonts.main};
`;

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // The AuthContext now provides 'undefined' during initial load, 'null' for logged out, and a user object for logged in.
  if (user === undefined) {
    return <LoadingWrapper><h1>Verifying Session...</h1></LoadingWrapper>;
  }

  // If not authenticated, redirect to login, passing the intended destination.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the route requires a specific role and the user does not have it, redirect.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and authorized, render the child routes.
  return <Outlet />;
};

export default ProtectedRoute;
