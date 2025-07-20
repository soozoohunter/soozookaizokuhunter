import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../apiClient';
import styled from 'styled-components';

const PageWrapper = styled.div`
  min-height: 100vh;
  padding: 4rem 2rem;
  background-color: ${({ theme }) => theme.colors.light.card};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.light.background};
  width: 100%;
  max-width: 700px;
  padding: 2.5rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  box-shadow: ${({ theme }) => theme.shadows.main};
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.light.text};
  font-size: 2rem;
`;

const InfoBlock = styled.div`
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
`;

const InfoRow = styled.p`
  margin: 0.8rem 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  strong {
    color: #4b5563;
    min-width: 180px;
    flex-shrink: 0;
  }
  span {
    color: #1f2937;
    font-family: 'Courier New', Courier, monospace;
    word-break: break-all;
  }
`;

const ButtonRow = styled.div`
  text-align: center;
  margin-top: 2rem;
`;

const NextButton = styled.button`
  background: ${({ theme }) => theme.colors.light.primary};
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  margin-left: 1rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.light.primaryHover};
  }
`;

const DownloadButton = styled.a`
  display: inline-block;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.light.primary};
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.light.primary};
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.light.secondary};
  }
`;

export default function ProtectStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  const { file, scanId } = location.state?.step1Data || {};

  useEffect(() => {
    if (!file) {
      alert('找不到上一步的資料，將返回第一步。');
      navigate('/protect/step1');
    }
  }, [file, navigate]);

  if (!file) return null;

  return (
    <PageWrapper>
      <Container>
        <Title>Step 2: 原創著作證明</Title>
        <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '1.5rem' }}>
          您的檔案已成功上傳，並產生了唯一的數位指紋存證於區塊鏈上。
        </p>
        <InfoBlock>
          <InfoRow><strong>檔案名稱:</strong> <span>{file.filename}</span></InfoRow>
          <InfoRow><strong>數位指紋 (SHA-256):</strong> <span>{file.fingerprint}</span></InfoRow>
          <InfoRow><strong>IPFS 存證 Hash:</strong> <span>{file.ipfsHash || 'N/A'}</span></InfoRow>
          <InfoRow><strong>區塊鏈交易 Hash:</strong> <span>{file.txHash || 'N/A'}</span></InfoRow>
        </InfoBlock>
        <ButtonRow>
          <DownloadButton
            href={`${apiClient.defaults.baseURL}/files/${file.id}/certificate`}
            download
          >
            下載原創著作證明書 (PDF)
          </DownloadButton>
          <NextButton onClick={() => navigate('/protect/step3', { state: { scanId, file } })}>
            下一步：啟動 AI 全網掃描 →
          </NextButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
