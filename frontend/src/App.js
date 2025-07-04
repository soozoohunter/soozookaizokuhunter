// frontend/src/App.js (最終重構版)
import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import styled, { createGlobalStyle } from 'styled-components';
import { AuthContext } from './AuthContext';

// --- Pages ---
import HomePage from './pages/Home';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/Contact';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/DashboardPage';
import FileDetailPage from './pages/FileDetailPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ProtectedRoute from './components/ProtectedRoute';

// [UI 優化] 全域樣式，設定基礎字體和背景
const GlobalStyle = styled.div`
  font-family: 'Inter', 'Roboto', sans-serif;
  background-color: #0a0f17;
  color: #e0e0e0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

// [UI 優化] 使用 styled-components 定義所有佈局和元件樣式
const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2.5rem;
  background-color: rgba(10, 15, 23, 0.8);
  border-bottom: 1px solid #374151;
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #F3F4F6;
`;

const NavLink = styled(Link)`
  color: #D1D5DB;
  text-decoration: none;
  font-size: 1rem;
  padding: 0.5rem 0.75rem;
  transition: color 0.2s ease;
  &:hover {
    color: #FFFFFF;
  }
`;

const NavButton = styled(Link)`
  color: #F97316;
  font-weight: bold;
  text-decoration: none;
  font-size: 1rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: 2px solid #F97316;
  background-color: transparent;
  transition: background-color 0.2s ease, color 0.2s ease;
  cursor: pointer;
  &:hover {
    background-color: #F97316;
    color: #FFFFFF;
  }
`;

const LoginButton = styled(NavButton)`
  background-color: #F97316;
  color: #FFFFFF;
  margin-left: 0.5rem;
  &:hover {
    background-color: #EA580C; // 橘色加深
    border-color: #EA580C;
  }
`;

const LogoutButton = styled.button`
    color: #9CA3AF;
    font-weight: bold;
    font-size: 1rem;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    border: 2px solid #4B5563;
    background-color: transparent;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    cursor: pointer;
    font-family: inherit;
    &:hover {
        background-color: #4B5563;
        color: #FFFFFF;
        border-color: #6B7280;
    }
`;

const MainContent = styled.main`
  flex-grow: 1;
  padding: 2rem;
`;

const Footer = styled.footer`
  text-align: center;
  padding: 1.5rem;
  background-color: #111827;
  border-top: 1px solid #374151;
  font-size: 0.9rem;
  color: '#9CA3AF';
`;


function RootLayout() {
  const { token, logout } = useContext(AuthContext);
  let userRole = '';
  if (token) {
    try {
      const decoded = jwt_decode(token);
      userRole = decoded.role || '';
    } catch (e) { console.error('Invalid token decode', e); }
  }

  return (
    <GlobalStyle>
      <Header>
        <NavSection>
            <NavLink to="/pricing">Pricing</NavLink>
            <NavLink to="/contact">Contact Us</NavLink>
        </NavSection>
        <BrandLink to="/">
            <img src="/logo0.jpg" alt="Logo" style={{ height: '40px', marginRight: '0.75rem' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>SUZOO IP Guard</span>
        </BrandLink>
        <NavSection>
            {!token ? (
                <>
                    <NavButton to="/register">Register</NavButton>
                    <LoginButton to="/login">Login</LoginButton>
                </>
            ) : (
                <>
                    <NavLink to="/dashboard">Dashboard</NavLink>
                    {userRole === 'admin' && (
                        <NavLink to="/admin/dashboard">Admin Panel</NavLink>
                    )}
                    <LogoutButton onClick={logout}>Logout</LogoutButton>
                </>
            )}
        </NavSection>
      </Header>
      <MainContent><Outlet /></MainContent>
      <Footer>
          <div>為紀念我最深愛的 曾李素珠 阿嬤<br /><span style={{ fontSize: '0.8rem', opacity: 0.85 }}>In loving memory of my beloved grandmother, Tseng Li Su-Chu.<br />by KaiKaiShield 凱盾</span></div>
      </Footer>
    </GlobalStyle>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* 公開路由 */}
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* 會員保護路由 */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="file/:fileId" element={<FileDetailPage />} />
          </Route>

          {/* 管理員保護路由 */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}