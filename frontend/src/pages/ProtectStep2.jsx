import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.dark.card};
  width: 100%;
  max-width: 700px;
  padding: 2.5rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.dark.accent};
  font-size: 2rem;
`;

const InfoBlock = styled.div`
  background: ${({ theme }) => theme.colors.dark.background};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const InfoRow = styled.p`
  margin: 1rem 0;
  font-size: 0.95rem;
  display: flex;
  flex-wrap: wrap;
  strong {
    color: ${({ theme }) => theme.colors.dark.textSecondary};
    display: inline-block;
    width: 180px;
    flex-shrink: 0;
  }
  span {
    color: ${({ theme }) => theme.colors.dark.text};
    font-family: 'Courier New', Courier, monospace;
    word-break: break-all;
  }
`;

const ButtonRow = styled.div`
  text-align: center;
`;

const NextButton = styled.button`
  background-color: ${({ theme }) => theme.colors.dark.primary};
  color: #fff;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.dark.primaryHover};
  }
`;

export default function ProtectStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  const { file, scanId } = location.state?.step1Data || {};

  useEffect(() => {
    if (!file || !scanId) {
      alert('找不到上一步的資料，將返回第一步。');
      navigate('/protect/step1');
    }
  }, [file, scanId, navigate]);

  if (!file || !scanId) {
    return null; 
  }

  return (
    <PageWrapper>
      <Container>
        <Title>Step 2: 原創著作證明書</Title>
        <p style={{ textAlign: 'center', color: '#9CA3AF', marginBottom: '1.5rem' }}>
          您的原創著作證明已成功建立並儲存於區塊鏈上。
        </p>
        <InfoBlock>
          <InfoRow><strong>檔案名稱:</strong> <span>{file.filename}</span></InfoRow>
          <InfoRow><strong>數位指紋 (SHA-256):</strong> <span>{file.fingerprint}</span></InfoRow>
          <InfoRow><strong>IPFS 存證 Hash:</strong> <span>{file.ipfs_hash || 'N/A'}</span></InfoRow>
          <InfoRow><strong>區塊鏈交易 Hash:</strong> <span>{file.tx_hash || 'N/A'}</span></InfoRow>
        </InfoBlock>
        <ButtonRow>
          <NextButton onClick={() => navigate('/protect/step3', { state: { scanId, file } })}>
            下一步：啟動 AI 全網掃描 →
          </NextButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
