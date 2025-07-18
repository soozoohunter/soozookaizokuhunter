import React, { useContext, useEffect, useCallback } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../AuthContext';
import apiClient from '../services/apiClient';

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2.5rem;
  background-color: rgba(17, 24, 39, 0.8);
  border-bottom: 1px solid #374151;
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #F3F4F6;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: bold;
`;

const NavLink = styled(Link)`
  color: #D1D5DB;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;
  &:hover { color: #FFFFFF; background-color: #374151; }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  color: #D1D5DB;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;
  &:hover { color: #FFFFFF; background-color: #374151; }
`;

const MainContent = styled.main`
  flex-grow: 1;
  padding: 2rem;
`;

const Footer = styled.footer`
  text-align: center;
  padding: 1.5rem;
  background-color: #1F2937;
  border-top: 1px solid #374151;
  font-size: 0.9rem;
  color: #9CA3AF;
`;

const AppLayout = () => {
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
        <div>
          為紀念我最深愛的 曾李素珠 阿嬤
          <br />
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            In loving memory of my beloved grandmother, Tseng Li Su-Chu.
            <br />by KaiKaiShield 凱盾
          </span>
        </div>
      </Footer>
    </AppWrapper>
  );
};

export default AppLayout;
