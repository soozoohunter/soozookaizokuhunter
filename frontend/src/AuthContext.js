import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    const checkTokenValidity = useCallback((authToken) => {
        if (!authToken) {
            setUser(null);
            localStorage.removeItem('token');
            return null;
        }
        try {
            const decoded = jwtDecode(authToken);
            if (decoded.exp * 1000 < Date.now()) {
                // Token expired
                localStorage.removeItem('token');
                setUser(null);
                return null;
            }
            setUser({ id: decoded.id, email: decoded.email, role: decoded.role });
            return authToken;
        } catch (error) {
            // Invalid token
            localStorage.removeItem('token');
            setUser(null);
            return null;
        }
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            const validToken = checkTokenValidity(storedToken);
            setToken(validToken);
        }
    }, [checkTokenValidity]);

    const login = (newToken, userData) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        if (userData) {
            setUser(userData);
        } else {
            checkTokenValidity(newToken);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = { token, user, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
