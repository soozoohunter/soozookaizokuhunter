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
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                // Check if the token is expired
                if (decodedToken.exp * 1000 > Date.now()) {
                    setUser({
                        id: decodedToken.id,
                        email: decodedToken.email,
                        role: decodedToken.role,
                    });
                } else {
                    // Token is expired, remove it
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error("Invalid token found during initial load:", error);
                localStorage.removeItem('token'); // Clean up invalid token
            }
        }
        setLoading(false); // Finish loading once token check is complete
    }, [logout]); // logout is stable due to useCallback with empty dependencies

    const login = (token) => {
        try {
            localStorage.setItem('token', token);
            const decodedToken = jwtDecode(token);
            setUser({
                id: decodedToken.id,
                email: decodedToken.email,
                role: decodedToken.role,
            });
        } catch (error) {
            console.error("Failed to decode token on login:", error);
            // If login fails, ensure everything is cleared
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    const authContextValue = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
    };

    // Render children only when not loading
    return (
        <AuthContext.Provider value={authContextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
