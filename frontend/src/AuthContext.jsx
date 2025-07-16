import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Logout function now only handles clearing state and localStorage.
    // Navigation will be handled by the component calling logout.
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    const initializeAuth = useCallback(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp > currentTime) {
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
        // Setup an interval to check token expiration periodically.
        const interval = setInterval(() => {
            const token = localStorage.getItem('token');
            if(token) {
                const decoded = jwtDecode(token);
                if (decoded.exp < Date.now() / 1000) {
                    console.log('Token check: Expired. Logging out.');
                    logout();
                }
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [initializeAuth, logout]);

    const login = (token) => {
        try {
            const decodedToken = jwtDecode(token);
            localStorage.setItem('token', token);
            setUser({
                id: decodedToken.id,
                email: decodedToken.email,
                role: decodedToken.role,
            });
        } catch (error) {
            console.error("Failed to decode token on login:", error);
            logout();
        }
    };

    const authContextValue = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
