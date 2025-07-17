import React, { useContext, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { AuthProvider, AuthContext } from './AuthContext';
import apiClient from './services/apiClient';

// --- Pages & Components ---
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FileDetailPage from './pages/FileDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4 from './pages/ProtectStep4';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './ErrorBoundary';
// 新增的設定頁面
import SettingsPage from './pages/SettingsPage'; 

// --- Styles ---
const GlobalStyle = createGlobalStyle`
  body { margin: 0; font-family: 'Inter', 'Roboto', sans-serif; background-color: #111827; color: #E5E7EB; }
`;
const AppWrapper = styled.div`
  display: flex; flex-direction: column; min-height: 100vh;
`;
const Header = styled.header`
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 2.5rem; background-color: rgba(17, 24, 39, 0.8);
  border-bottom: 1px solid #374151; backdrop-filter: blur(10px);
  position: sticky; top: 0; z-index: 1000;
`;
const NavSection = styled.div`
  display: flex; align-items: center; gap: 1.5rem;
`;
const BrandLink = styled(Link)`
  display: flex; align-items: center; text-decoration: none;
  color: #F3F4F6; gap: 0.75rem; font-size: 1.25rem; font-weight: bold;
`;
const NavLink = styled(Link)`
  color: #D1D5DB; text-decoration: none; font-size: 1rem; font-weight: 500;
  padding: 0.5rem 0.75rem; border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;
  &:hover { color: #FFFFFF; background-color: #374151; }
`;
const LogoutButton = styled.button`
  background: none; border: none; cursor: pointer; font-family: inherit;
  color: #D1D5DB; text-decoration: none; font-size: 1rem; font-weight: 500;
  padding: 0.5rem 0.75rem; border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;
  &:hover { color: #FFFFFF; background-color: #374151; }
`;
const MainContent = styled.main`
  flex-grow: 1; padding: 2rem;
`;
const Footer = styled.footer`
  text-align: center; padding: 1.5rem; background-color: #1F2937;
  border-top: 1px solid #374151; font-size: 0.9rem; color: #9CA3AF;
`;

// Layout Component: Manages page structure and global logic
const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        logout();
        navigate('/login', { replace: true });
    }, [logout, navigate]);

    // Setup API interceptor here, as it has access to both router and auth contexts
    useEffect(() => {
        const interceptorId = apiClient.interceptors.response.use(
            response => response,
            error => {
                if (error.response && [401, 403].includes(error.response.status)) {
                    console.log(`API Interceptor: Caught ${error.response.status}, logging out.`);
                    handleLogout();
                }
                return Promise.reject(error);
            }
        );
        return () => apiClient.interceptors.response.eject(interceptorId);
    }, [handleLogout]);

    return (
        <AppWrapper>
            <Header>
                <NavSection>
                    <NavLink to="/pricing">服務價格</NavLink>
                    <NavLink to="/contact">聯絡我們</NavLink>
                </NavSection>
                <BrandLink to="/">
                    <img src="/logo0.jpg" alt="Logo" style={{ height: '40px' }} />
                    <span>SUZOO IP Guard</span>
                </BrandLink>
                <NavSection>
                    {!user ? (
                        <>
                            <NavLink to="/register">註冊</NavLink>
                            <NavLink to="/login">登入</NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/dashboard">儀表板</NavLink>
                            <NavLink to="/settings/api-keys">API 設定</NavLink>
                            {user.role === 'admin' && (
                                <NavLink to="/admin/dashboard">管理面板</NavLink>
                            )}
                            <LogoutButton onClick={handleLogout}>登出</LogoutButton>
                        </>
                    )}
                </NavSection>
            </Header>
            <MainContent>
                <Outlet />
            </MainContent>
            <Footer>
                <div>為紀念我最深愛的 曾李素珠 阿嬤<br /><span style={{ fontSize: '0.8rem', opacity: 0.85 }}>In loving memory of my beloved grandmother, Tseng Li Su-Chu.<br />by KaiKaiShield 凱盾</span></div>
            </Footer>
        </AppWrapper>
    );
};

// Main App Component: Sets up providers and routes
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalStyle />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="admin/login" element={<AdminLoginPage />} />
              <Route path="protect/step1" element={<ProtectStep1 />} />
              <Route path="protect/step2" element={<ProtectStep2 />} />
              <Route path="protect/step3" element={<ProtectStep3 />} />
              <Route path="protect/step4" element={<ProtectStep4 />} />
              <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="file/:fileId" element={<FileDetailPage />} />
                <Route path="settings/api-keys" element={<SettingsPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="admin/users" element={<AdminUsersPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

### **第二部分：API 功能整合框架**

以下是您需要**新增**的檔案，它們為後續的 API 整合提供了堅實的基礎。

#### 3. `frontend/src/pages/SettingsPage.jsx` (新檔案)
這個頁面讓使用者可以管理他們的 API 金鑰。


```javascript
import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import apiClient from '../services/apiClient';

const API_KEY_SERVICES = [
  { id: 'google_vision', name: 'Google Vision' },
  { id: 'tineye', name: 'TinEye' },
  { id: 'dmca', name: 'DMCA.com' },
  // RapidAPI keys can be added here if needed, or managed via a single RapidAPI key
];

const SettingsPage = () => {
  const { user, updateApiKeysInState } = useContext(AuthContext);
  // Initialize keys from user context or with empty strings
  const [keys, setKeys] = useState(API_KEY_SERVICES.reduce((acc, service) => {
    acc[service.id] = user?.apiKeys?.[service.id] || '';
    return acc;
  }, {}));
  
  const [status, setStatus] = useState({ saving: false, success: false, error: null });

  const handleChange = (service, value) => {
    setKeys(prev => ({ ...prev, [service]: value }));
  };

  const saveKeys = async () => {
    setStatus({ saving: true, success: false, error: null });
    
    try {
      // Save all keys to the backend
      const response = await apiClient.post('/api/user/api-keys', { keys });
      
      // Update the frontend state
      updateApiKeysInState(response.data.keys);
      setStatus({ saving: false, success: true, error: null });

    } catch (error) {
      console.error('保存API金鑰失敗:', error);
      setStatus({ saving: false, success: false, error: error.response?.data?.detail || '保存失敗' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">API 金鑰設定</h1>
      
      <div className="bg-gray-800 shadow-lg rounded-lg p-6">
        {API_KEY_SERVICES.map(service => (
          <div key={service.id} className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor={service.id}>
              {service.name} API 金鑰
            </label>
            <input
              id={service.id}
              type="password"
              value={keys[service.id]}
              onChange={(e) => handleChange(service.id, e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"
              placeholder={`請輸入您的 ${service.name} API 金鑰`}
            />
          </div>
        ))}
        
        <div className="flex items-center mt-6">
          <button
            onClick={saveKeys}
            disabled={status.saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {status.saving ? '保存中...' : '保存設定'}
          </button>
          
          {status.success && (
            <span className="ml-4 text-green-500">設定已成功保存！</span>
          )}
          {status.error && (
             <span className="ml-4 text-red-500">{status.error}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
