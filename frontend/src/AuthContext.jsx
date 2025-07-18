import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                const decodedToken = jwtDecode(storedToken);
                if (decodedToken.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setUser({
                        id: decodedToken.id,
                        email: decodedToken.email,
                        role: decodedToken.role,
                    });
                } else {
                    localStorage.removeItem('token');
                }
            }
        } catch (error) {
            console.error("AuthContext: Could not process token from storage.", error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback((tokenValue) => {
        try {
            const decodedToken = jwtDecode(tokenValue);
            localStorage.setItem('token', tokenValue);
            setToken(tokenValue);
            setUser({
                id: decodedToken.id,
                email: decodedToken.email,
                role: decodedToken.role,
            });
        } catch (error) {
            console.error("AuthContext: Failed to process token on login.", error);
            logout();
        }
    }, [logout]);

    const authContextValue = useMemo(() => ({
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
    }), [user, token, loading, login, logout]);

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
