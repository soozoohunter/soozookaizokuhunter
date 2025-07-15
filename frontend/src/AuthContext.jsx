import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// [關鍵修正] 確保使用 jwt-decode v4+ 的正確具名引入方式
import { jwtDecode } from 'jwt-decode';
import apiClient from './services/apiClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        delete apiClient.defaults.headers.common['Authorization'];
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const initializeAuth = useCallback(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp > currentTime) {
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    setUser({
                        id: decodedToken.id,
                        email: decodedToken.email,
                        role: decodedToken.role,
                    });
                } else {
                    console.log("Token expired, logging out.");
                    logout();
                }
            } catch (error) {
                console.error("Invalid token, logging out.", error);
                logout();
            }
        }
        setLoading(false);
    }, [logout]);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = (token) => {
        try {
            const decodedToken = jwtDecode(token);
            localStorage.setItem('token', token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser({
                id: decodedToken.id,
                email: decodedToken.email,
                role: decodedToken.role,
            });
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to decode token on login:", error);
            // Clear any potentially bad token
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
