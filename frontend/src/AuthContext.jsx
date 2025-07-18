import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
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
            const stored = localStorage.getItem('token');
            if (stored) {
                const decodedToken = jwtDecode(stored);
                if (decodedToken.exp * 1000 > Date.now()) {
                    setToken(stored);
                    setUser({
                        id: decodedToken.id,
                        email: decodedToken.email,
                        role: decodedToken.role,
                        apiKeys: decodedToken.apiKeys || {}
                    });
                } else {
                    logout();
                }
            }
        } catch (error) {
            console.error("Invalid token found, clearing token.", error);
            logout();
        } finally {
            setLoading(false);
        }
    }, [logout]);

    const login = (tokenValue) => {
        try {
            localStorage.setItem('token', tokenValue);
            setToken(tokenValue);
            const decodedToken = jwtDecode(tokenValue);
            setUser({
                id: decodedToken.id,
                email: decodedToken.email,
                role: decodedToken.role,
                apiKeys: decodedToken.apiKeys || {}
            });
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to process token on login:", error);
            logout();
        }
    };
    
    const updateApiKeysInState = (newKeys) => {
        setUser(currentUser => {
            if (!currentUser) return null;
            return {
                ...currentUser,
                apiKeys: { ...currentUser.apiKeys, ...newKeys }
            };
        });
    };

    const authContextValue = {
        user,
        token,
        login,
        logout,
        updateApiKeysInState,
        isAuthenticated: !!user,
        loading,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
