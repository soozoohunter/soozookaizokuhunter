import React, { createContext, useState, useEffect, useCallback } from 'react';
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
        if (decodedUser.exp * 1000 > Date.now()) {
          setUser(decodedUser);
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Failed to decode token on initial load', error);
        logout();
      }
    }
  }, [token]);

  const login = useCallback((newToken) => {
    try {
      const decodedUser = jwtDecode(newToken);
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setUser(decodedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to decode token on login', error);
      logout();
    }
  }, []);

  const logout = useCallback((navigate) => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    if (navigate) {
      navigate('/login');
    }
  }, []);

  const value = {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
