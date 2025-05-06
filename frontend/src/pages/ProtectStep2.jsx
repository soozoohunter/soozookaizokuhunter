// frontend/src/pages/ProtectStep2.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

/* 背景漸層流動 */
const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
/* 霓虹光暈 */
const neonGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px #ff6f00;
  }
  50% {
    box-shadow: 0 0 25px #ff6f00;
  }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(-45deg, #202020, #1a1a1a, #2a2a2a, #0f0f0f);
  background-size: 500% 500%;
  animation: ${gradientFlow} 12s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

const Container = styled.div`
  width: 95%;
  max-width: 600px;
  background-color: rgba(30, 30, 30, 0.8);
  border-radius: 12px;
  border: 2px solid #ff6f00;
  padding: 2rem;
  animation: ${neonGlow} 2s ease-in-out infinite alternate;
`;

const Title = styled.h2`
  color: #FFD700;
  margin-bottom: 1rem;
  text-align: center;
`;

const InfoBlock = styled.div`
  background-color: #1e1e1e;
  border: 1px solid #ff6f00;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  word-break: break-all;
`;

const NextButton = styled.button`
  background-color: #f97316;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background-color: #ea580c;
    box-shadow: 0 0 8px #ff6f00;
  }
`;

export default function ProtectStep2() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    // 讀取 Step1 存的
    const stored = localStorage.getItem('protectStep1');
    if (!stored) {
      // 若沒有 => 直接跳回 step1
      navigate('/protect/step1');
      return;
    }
    const data = JSON.parse(stored);
    setResult(data);
  }, [navigate]);

  if (!result) {
    return (
      <PageWrapper>
        <Container>
          <p>Loading Step2...</p>
        </Container>
      </PageWrapper>
    );
  }

  const {
    fileId,
    pdfUrl,
    fingerprint,
    ipfsHash,
    txHash,
    protectedFileUrl
  } = result;

  const handleGoNext = () => {
    // 假設進行下一步 => Step3
    navigate('/protect/step3');
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Step 2: 上傳完成 &amp; 產生證書</Title>
        <InfoBlock>
          <p><strong>File ID:</strong> {fileId}</p>
          <p><strong>Fingerprint (SHA-256):</strong> {fingerprint || 'N/A'}</p>
          <p><strong>IPFS Hash:</strong> {ipfsHash || 'N/A'}</p>
          <p><strong>TxHash:</strong> {txHash || 'N/A'}</p>
        </InfoBlock>

        {/* 顯示 PDF 連結 */}
        {pdfUrl ? (
          <InfoBlock>
            <p><strong>原創證書 PDF:</strong></p>
            <p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#4caf50', textDecoration: 'underline' }}
              >
                點我下載 / Download PDF
              </a>
            </p>
          </InfoBlock>
        ) : (
          <InfoBlock>
            <p>尚未生成 PDF 連結 (pdfUrl 為空)</p>
          </InfoBlock>
        )}

        {/* 防側錄後檔案 => protectedFileUrl */}
        {protectedFileUrl && (
          <InfoBlock style={{ backgroundColor: '#2c2c2c' }}>
            <p><strong>防護後檔案 (Protected File):</strong></p>
            <p>
              <a
                href={protectedFileUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#f97316', textDecoration: 'underline' }}
              >
                點我下載 / Download Protected File
              </a>
            </p>
          </InfoBlock>
        )}

        <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
          <NextButton onClick={handleGoNext}>
            下一步 (侵權掃描) →
          </NextButton>
        </div>
      </Container>
    </PageWrapper>
  );
}
