import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 使用 useCallback 確保 logout 函式的引用穩定，避免不必要的重新渲染
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    // 應用程式首次加載時，從 localStorage 初始化驗證狀態
    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const decodedToken = jwtDecode(token);
                // 檢查 token 是否過期
                if (decodedToken.exp * 1000 > Date.now()) {
                    setUser({
                        id: decodedToken.id,
                        email: decodedToken.email,
                        role: decodedToken.role,
                        // 確保 apiKeys 存在，即使 token 中沒有
                        apiKeys: decodedToken.apiKeys || {} 
                    });
                } else {
                    console.log("AuthContext: Token expired, logging out.");
                    logout();
                }
            }
        } catch (error) {
            console.error("AuthContext: Invalid token found, clearing token.", error);
            logout(); // 如果 token 格式錯誤，也執行登出
        } finally {
            setLoading(false); // 無論如何，最後都結束載入狀態
        }
    }, [logout]);

    // 登入函式：更新狀態並儲存 token
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
            console.error("AuthContext: Failed to process token on login.", error);
            logout(); // 如果登入時 token 有問題，也直接登出
        }
    };
    
    // 更新前端狀態中的 API 金鑰 (例如，在設定頁面保存後)
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
        updateApiKeysInState, // 提供給設定頁面使用
        isAuthenticated: !!user,
        loading,
    };

    // 在 loading 結束前不渲染任何子元件，確保子元件能獲得正確的 user 狀態
    return (
        <AuthContext.Provider value={authContextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
