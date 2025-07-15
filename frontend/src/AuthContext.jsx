import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import apiClient, { setupResponseInterceptor } from './services/apiClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    }, [navigate]);
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                if (decodedToken.exp * 1000 > Date.now()) {
                    setUser({ id: decodedToken.id, email: decodedToken.email, role: decodedToken.role });
                } else {
                    logout();
                }
            } catch (e) {
                logout();
            }
        }
        setLoading(false);
        setupResponseInterceptor(logout);
    }, [logout]);

    const login = (token) => {
        try {
            const decodedToken = jwtDecode(token);
            localStorage.setItem('token', token);
            setUser({ id: decodedToken.id, email: decodedToken.email, role: decodedToken.role });
            navigate('/dashboard');
        } catch (error) {
            logout();
        }
    };

    const authContextValue = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
