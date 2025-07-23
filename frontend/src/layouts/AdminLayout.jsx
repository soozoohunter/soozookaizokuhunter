import React, { useContext } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../AuthContext';

const AdminWrapper = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.div`
  width: 240px;
  background: #111827;
  color: #d1d5db;
  padding: 1.5rem;
  flex-shrink: 0;
`;

const NavLink = styled(Link)`
  display: block;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  color: #d1d5db;
  text-decoration: none;
  margin-bottom: 0.5rem;
  background-color: ${({ active }) => (active ? 'rgba(255,255,255,0.1)' : 'transparent')};
  &:hover {
    background-color: rgba(255,255,255,0.05);
  }
`;

const MainContent = styled.main`
  flex-grow: 1;
  background: #f3f4f6;
  padding: 2rem;
`;

const AdminLayout = () => {
  const { user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) return <div>載入中...</div>;

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <AdminWrapper>
      <Sidebar>
        <h3>管理後台</h3>
        <nav>
          <NavLink to="/admin/dashboard" active={location.pathname === '/admin/dashboard'}>總覽儀表板</NavLink>
          <NavLink to="/admin/users" active={location.pathname.startsWith('/admin/users')}>使用者管理</NavLink>
          <NavLink to="/admin/payments" active={location.pathname === '/admin/payments'}>付款審核</NavLink>
        </nav>
      </Sidebar>
      <MainContent>
        <Outlet />
      </MainContent>
    </AdminWrapper>
  );
};

export default AdminLayout;
