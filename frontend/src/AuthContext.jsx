import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);

  const login = (newToken) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    setToken(null);
  };

  useEffect(() => {
    const stored = localStorage.getItem('authToken');
    if (stored && !token) {
      setToken(stored);
    }
  }, [token]);

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
