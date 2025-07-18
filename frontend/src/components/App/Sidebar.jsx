import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../../AuthContext';

const SidebarWrapper = styled.div`
  width: 240px;
  background-color: ${({ theme }) => theme.colors.dark.card};
  border-right: 1px solid ${({ theme }) => theme.colors.dark.border};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2.5rem;
  padding: 0 10px;

  img {
    height: 35px;
  }
  
  span {
    font-weight: bold;
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.dark.text};
  }
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const StyledNavLink = styled(NavLink)`
  padding: 12px 16px;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.dark.textSecondary};
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
  
  &.active, &:hover {
    background-color: ${({ theme }) => theme.colors.dark.primary};
    color: #FFFFFF;
  }
`;

const LogoutButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  color: ${({ theme }) => theme.colors.dark.textSecondary};
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  font-weight: 500;

  &:hover {
    border-color: ${({ theme }) => theme.colors.dark.primary};
    color: ${({ theme }) => theme.colors.dark.text};
  }
`;


const Sidebar = () => {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <SidebarWrapper>
            <Logo>
                <img src="/suzoo-logo.png" alt="SUZOO IP Guard Logo" />
                <span>SUZOO</span>
            </Logo>
            <NavList>
                <StyledNavLink to="/dashboard">儀表板</StyledNavLink>
                <StyledNavLink to="/protect/step1">開始保護</StyledNavLink>
                <StyledNavLink to="/settings/api-keys">API 金鑰設定</StyledNavLink>
                {user?.role === 'admin' && (
                    <>
                        <hr style={{ borderColor: '#374151', margin: '1rem 0' }} />
                        <StyledNavLink to="/admin/dashboard">管理員面板</StyledNavLink>
                        <StyledNavLink to="/admin/users">使用者管理</StyledNavLink>
                    </>
                )}
            </NavList>
            <LogoutButton onClick={handleLogout}>登出</LogoutButton>
        </SidebarWrapper>
    );
};

export default Sidebar;
