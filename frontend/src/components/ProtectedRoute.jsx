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
  background-color: ${({ theme }) => theme.colors.dark.background};
  color: ${({ theme }) => theme.colors.dark.text};
  font-family: ${({ theme }) => theme.fonts.main};
`;

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, checkTokenValidity } = useContext(AuthContext);

  // Re-validate token on component mount
  React.useEffect(() => {
    if (token) {
      checkTokenValidity(token);
    }
  }, [token, checkTokenValidity]);

  // Handle initial loading state
  if (user === undefined) {
    return <LoadingWrapper><h1>Verifying Session...</h1></LoadingWrapper>;
  }
  
  // If no user object, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user's role is not included, redirect
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect non-admins trying to access admin routes
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
