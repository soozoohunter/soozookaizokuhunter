// frontend/src/AuthContext.jsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
// Updated import for jwt-decode v4+
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        // Check if token is expired
        if (decodedUser.exp * 1000 > Date.now()) {
          setUser(decodedUser);
          setIsAuthenticated(true);
        } else {
          // Token is expired, log the user out
          logout();
        }
      } catch (error) {
        console.error('Failed to decode token on initial load, logging out.', error);
        logout();
      }
    }
  }, [token]); // Dependency on token ensures this runs when token changes

  const login = useCallback((newToken) => {
    try {
      const decodedUser = jwtDecode(newToken);
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setUser(decodedUser);
      setIsAuthenticated(true);
    } catch (error)      {
      console.error('Failed to decode token on login', error);
      // If login fails with a bad token, ensure user is logged out
      logout();
    }
  }, []); // Empty dependency array because it doesn't depend on component state

  const logout = useCallback((navigate) => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    if (navigate) {
      navigate('/login');
    }
  }, []); // Empty dependency array

  const value = {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
