import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const decodedToken = jwtDecode(token);
                if (decodedToken.exp * 1000 > Date.now()) {
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

    const login = (token) => {
        try {
            localStorage.setItem('token', token);
            const decodedToken = jwtDecode(token);
            setUser({
                id: decodedToken.id,
                email: decodedToken.email,
                role: decodedToken.role,
                apiKeys: decodedToken.apiKeys || {}
            });
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
