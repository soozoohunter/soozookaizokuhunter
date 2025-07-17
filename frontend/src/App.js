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

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        logout();
        navigate('/login', { replace: true });
    }, [logout, navigate]);

    useEffect(() => {
        const interceptorId = apiClient.interceptors.response.use(
            response => response,
            error => {
                if (error.response && [401, 403].includes(error.response.status)) {
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
                            {user.role === 'admin' && (
                                <NavLink to="/settings/api-keys">API 設定</NavLink>
                            )}
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
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="settings/api-keys" element={<SettingsPage />} />
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
