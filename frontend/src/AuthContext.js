import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    // Initialize user as 'undefined' to represent a loading state
    const [user, setUser] = useState(undefined); 

    const checkTokenValidity = useCallback((authToken) => {
        if (!authToken) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null); // Explicitly set to null (not logged in)
            return;
        }
        try {
            const decoded = jwtDecode(authToken);
            if (decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            } else {
                setUser({ id: decoded.id, email: decoded.email, role: decoded.role });
                setToken(authToken);
            }
        } catch (error) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        checkTokenValidity(storedToken);
    }, [checkTokenValidity]);

    const login = (newToken, userData) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        if (userData) {
            setUser(userData);
        } else {
            // If user data isn't passed, decode it from the token
            checkTokenValidity(newToken);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = { token, user, login, logout, checkTokenValidity };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
