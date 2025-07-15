import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // [關鍵修正] 使用默認導入
import apiClient from './services/apiClient';

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

    // 負責在應用程式加載時初始化用戶狀態
    const initializeAuth = useCallback(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp > currentTime) {
                    // apiClient 的攔截器會自動處理 header，這裡無需手動設定
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

    // 登入邏輯
    const login = (token) => {
        try {
            const decodedToken = jwtDecode(token);
            localStorage.setItem('token', token);
            // apiClient 的攔截器會自動處理後續請求的 header
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
