// frontend/src/pages/ProtectStep2.jsx (v3.0 - 邏輯修正、樣式完整保留版)
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
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
const progressAnim = keyframes`
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 0%; }
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
`;
const Container = styled.div`
  background-color: rgba(20, 20, 20, 0.8);
  width: 95%;
  max-width: 600px;
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
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  word-break: break-all;
`;
const ButtonRow = styled.div`
  text-align: center;
`;
const OrangeButton = styled.button`
  background-color: #f97316;
  color: #fff;
  border: none;
  padding: 0.75rem 1.2rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  &:hover:not(:disabled) {
    background-color: #ea580c;
  }
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;
const Spinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  margin-right: 0.5rem;
  animation: ${spin} 0.8s linear infinite;
  vertical-align: middle;
`;
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const LoadingBox = styled.div`
  text-align: center;
`;
const ProgressBar = styled.div`
  width: 80%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
  margin-left: auto;
  margin-right: auto;
`;
const ProgressIndicator = styled.div`
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, #f97316, #ffce00);
  background-size: 200% 100%;
  animation: ${progressAnim} 1s linear infinite;
`;

export default function ProtectStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step1Data, setStep1Data] = useState(location.state?.step1Data || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!step1Data) {
      const storedData = localStorage.getItem('protectStep1');
      if (storedData) {
        setStep1Data(JSON.parse(storedData));
      } else {
        alert('找不到上一步的資料，請重新上傳。');
        navigate('/protect/step1');
      }
    }
  }, [step1Data, navigate]);

  const handleProceedToNextStep = () => {
    if (!step1Data?.file?.id) {
      alert('錯誤：無效的檔案資訊，無法繼續。');
      return;
    }
    
    setIsLoading(true);

    const taskId = step1Data.file.id;
    
    // 為了保留載入動畫的體驗，我們可以在這裡做一個短暫的延遲再跳轉
    setTimeout(() => {
        navigate('/protect/step3', { state: { taskId, step1Data } });
    }, 500);
  };

  if (!step1Data) {
    return (
      <PageWrapper>
        <Container>
          <Title>正在載入資料...</Title>
        </Container>
      </PageWrapper>
    );
  }

  const { file } = step1Data;

  return (
    <PageWrapper>
      <Container>
        <Title>Step 2: 憑證已生成</Title>
        <p style={{ textAlign: 'center', color: '#ccc', marginBottom: '1.5rem' }}>
          您的原創著作證明已成功建立並儲存於區塊鏈上。
        </p>
        <InfoBlock>
          <p><strong>檔案 ID:</strong> {file.id || 'N/A'}</p>
          <p><strong>數位指紋 (SHA-256):</strong> {file.fingerprint || 'N/A'}</p>
          <p><strong>IPFS Hash:</strong> {file.ipfs_hash || 'N/A'}</p>
          <p><strong>區塊鏈交易 Hash:</strong> {file.tx_hash || 'N/A'}</p>
        </InfoBlock>
        <ButtonRow>
          <OrangeButton onClick={handleProceedToNextStep} disabled={isLoading}>
            {isLoading && <Spinner />}
            {isLoading ? '準備中...' : '下一步：查看掃描結果 →'}
          </OrangeButton>
        </ButtonRow>
      </Container>
      {isLoading && (
        <Overlay>
          <LoadingBox>
            <Spinner />
            <p>正在準備結果頁面...</p>
            <ProgressBar>
              <ProgressIndicator />
            </ProgressBar>
          </LoadingBox>
        </Overlay>
      )}
    </PageWrapper>
  );
}
