import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const neonGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px #ff6f00; }
  50% { box-shadow: 0 0 25px #ff6f00; }
`;
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(-45deg, #202020, #1a1a1a, #2a2a2a, #0f0f0f);
  background-size: 500% 500%;
  animation: ${gradientFlow} 10s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  padding: 2rem;
`;
const Container = styled.div`
  background-color: rgba(20, 20, 20, 0.85);
  width: 95%;
  max-width: 700px;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  border: 1px solid #444;
  animation: ${neonGlow} 2s ease-in-out infinite alternate;
`;
const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.2rem;
  color: #ffd700;
  font-weight: 700;
  letter-spacing: 1px;
`;
const InfoBlock = styled.div`
  background: #111827;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  line-height: 1.7;
`;
const InfoRow = styled.p`
  margin: 0.8rem 0;
  font-size: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  strong {
    color: #9CA3AF;
    display: inline-block;
    width: 160px;
    flex-shrink: 0;
  }
  span {
    color: #F3F4F6;
    font-family: 'Courier New', Courier, monospace;
    word-break: break-all;
  }
`;
const ButtonRow = styled.div`
  text-align: center;
`;
const OrangeButton = styled.button`
  background-color: #f97316;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover:not(:disabled) {
    background-color: #ea580c;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
  }
`;

export default function ProtectStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  // [修正] 直接從 location.state 獲取 file 和 scanId
  const { file, scanId } = location.state?.step1Data || {};
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file || !scanId) {
      setError('找不到上一步的資料，請重新上傳。');
      setIsLoading(false);
      return;
    }

    // [新增] 確保所有必要資料存在
    if (!file.fingerprint || !file.ipfs_hash || !file.tx_hash) {
      setError('檔案資訊不完整，請重新上傳。');
    }

    setIsLoading(false);
  }, [file, scanId]);

  const handleNext = () => {
    navigate('/protect/step3', { state: { scanId, file } });
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <Title>Step 2: 載入中...</Title>
          <p style={{ textAlign: 'center', color: '#ccc' }}>正在獲取檔案資訊...</p>
        </Container>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <Container>
          <Title>Step 2: 錯誤</Title>
          <InfoBlock>
            <p style={{ color: '#F87171', textAlign: 'center' }}>{error}</p>
          </InfoBlock>
          <ButtonRow>
            <OrangeButton onClick={() => navigate('/protect/step1')}>
              返回上一步
            </OrangeButton>
          </ButtonRow>
        </Container>
      </PageWrapper>
    );
  }


  return (
    <PageWrapper>
      <Container>
        <Title>Step 2: 原創著作證明書</Title>
        <p style={{ textAlign: 'center', color: '#ccc', marginBottom: '1.5rem' }}>
          您的原創著作證明已成功建立並儲存於區塊鏈上。
        </p>
        <InfoBlock>
          <InfoRow><strong>檔案名稱:</strong> <span>{file?.filename || 'N/A'}</span></InfoRow>
          <InfoRow><strong>檔案 ID:</strong> <span>{file?.id || 'N/A'}</span></InfoRow>
          <InfoRow><strong>掃描任務 ID:</strong> <span>{scanId || 'N/A'}</span></InfoRow>
          <InfoRow><strong>數位指紋 (SHA-256):</strong> <span>{file?.fingerprint || 'N/A'}</span></InfoRow>
          <InfoRow><strong>IPFS 存證 Hash:</strong> <span>{file?.ipfs_hash || 'N/A'}</span></InfoRow>
          <InfoRow><strong>區塊鏈交易 Hash:</strong> <span>{file?.tx_hash || 'N/A'}</span></InfoRow>
        </InfoBlock>
        <ButtonRow>
          <OrangeButton onClick={handleNext}>
            下一步：啟動 AI 全網掃描 →
          </OrangeButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
