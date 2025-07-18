import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.light.card};
`;

const Title = styled.h1`
  font-size: 5rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.light.primary};
`;

const Message = styled.p`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.light.textMuted};
  margin-bottom: 2rem;
`;

const HomeLink = styled(Link)`
  text-decoration: none;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.light.primary};
  background: ${({ theme }) => theme.colors.light.secondary};
  color: ${({ theme }) => theme.colors.light.text};
  
  &:hover {
    background: ${({ theme }) => theme.colors.light.primary};
    color: white;
  }
`;

export default function NotFoundPage() {
  return (
    <PageWrapper>
      <Title>404</Title>
      <Message>抱歉，我們找不到您要尋找的頁面。</Message>
      <HomeLink to="/">返回首頁</HomeLink>
    </PageWrapper>
  );
}
