import React from 'react';
import styled from 'styled-components';

const SignatureWrapper = styled.div`
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
`;

const AuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const AuthorName = styled.p`
  margin: 0;
  font-weight: bold;
  color: #111;
`;

const AuthorTitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
`;

const ArticleSignature = () => {
  return (
    <SignatureWrapper>
      <LogoImage src="/suzoo-logo.png" alt="SUZOO IP Guard Logo" />
      <AuthorInfo>
        <AuthorName>Zack Yao</AuthorName>
        <AuthorTitle>SUZOO IP Guard 創辦人 & CEO</AuthorTitle>
      </AuthorInfo>
    </SignatureWrapper>
  );
};

export default ArticleSignature;
