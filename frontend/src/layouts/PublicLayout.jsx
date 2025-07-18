import React from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/Blog/Header';
import Footer from '../components/Blog/Footer';

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
`;

const PublicLayout = () => (
  <AppWrapper>
    <Header />
    <MainContent>
      <Outlet />
    </MainContent>
    <Footer />
  </AppWrapper>
);

export default PublicLayout;
