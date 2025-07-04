// frontend/src/App.js (導覽列 UI 還原版)
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
// Protect workflow pages
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4 from './pages/ProtectStep4';
import ProtectStep4Infringement from './pages/ProtectStep4Infringement';

// [UI 還原] 定義一個統一的導覽列連結樣式
const NavLink = styled(Link)`
  color: #D1D5DB;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover {
    color: #FFFFFF;
    background-color: #374151;
  }
`;

// [UI 還原] 建立一個看起來和 NavLink 一樣的 button 元件，用於登出
const NavButtonAsLink = styled.button`
  color: #D1D5DB;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;
  
  /* button 樣式重設 */
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: #FFFFFF;
    background-color: #374151;
  }
`;

// 其他元件樣式
const GlobalStyle = styled.div`
  font-family: 'Inter', 'Roboto', sans-serif;
  background-color: #0a0f17;
  color: #e0e0e0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

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
  gap: 1.5rem; // 統一間距
`;

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #F3F4F6;
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
  color: #9CA3AF;
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
                    {/* [UI 還原] Register 和 Login 都使用 NavLink 樣式 */}
                    <NavLink to="/register">Register</NavLink>
                    <NavLink to="/login">Login</NavLink>
                    <NavLink to="/admin/login">Admin</NavLink>
                </>
            ) : (
                <>
                    <NavLink to="/dashboard">Dashboard</NavLink>
                    {userRole === 'admin' && (
                        <NavLink to="/admin/dashboard">Admin Panel</NavLink>
                    )}
                    {/* [UI 還原] Logout 使用看起來像連結的 button 樣式 */}
                    <NavButtonAsLink onClick={logout}>Logout</NavButtonAsLink>
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

          {/* 受保護的會員路由 */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="file/:fileId" element={<FileDetailPage />} />
            <Route path="protect">
              <Route path="step1" element={<ProtectStep1 />} />
              <Route path="step2" element={<ProtectStep2 />} />
              <Route path="step3" element={<ProtectStep3 />} />
              <Route path="step4" element={<ProtectStep4 />} />
              <Route path="step4/infringement" element={<ProtectStep4Infringement />} />
            </Route>
          </Route>

          {/* 受保護的管理員路由 */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
