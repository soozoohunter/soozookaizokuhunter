import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
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

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const OrangeButton = styled.button`
  background-color: #f97316;
  color: #fff;
  border: none;
  padding: 0.75rem 1.2rem;
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
  const [step1Data, setStep1Data] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem('protectStep1');
    if (storedData) {
      setStep1Data(JSON.parse(storedData));
    } else {
      navigate('/protect/step1');
    }
  }, [navigate]);

  const handleProceedToScan = async () => {
    if (!step1Data || !step1Data.file.id) {
      alert('錯誤：無效的檔案資訊。');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/protect/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: step1Data.file.id }),
      });
      if (!response.ok) throw new Error('啟動掃描任務失敗。');

      const data = await response.json();

      navigate('/protect/step3', {
        state: {
          taskId: data.taskId,
          fileInfo: step1Data.file,
          userInfo: step1Data.user,
        },
      });
    } catch (error) {
      alert(`啟動掃描失敗：${error.message}`);
      setIsLoading(false);
    }
  };

  if (!step1Data) return <div>Loading...</div>;

  const { file, user } = step1Data;

  return (
    <PageWrapper>
      <Container>
        <Title>Step 2: Certificate Generated</Title>
        <p style={{ textAlign: 'center', color: '#ccc', marginBottom: '1.5rem' }}>
          您的原創著作證明已成功建立並儲存於區塊鏈上。
        </p>

        <InfoBlock>
          <p><strong>File ID:</strong> {file?.id || 'N/A'}</p>
          <p><strong>Fingerprint (SHA-256):</strong> {file?.fingerprint || 'N/A'}</p>
          <p><strong>IPFS Hash:</strong> {file?.ipfsHash || 'N/A'}</p>
          <p><strong>Blockchain TxHash:</strong> {file?.txHash || 'N/A'}</p>
        </InfoBlock>

        {file?.pdfUrl && (
          <InfoBlock>
            <p><strong>原創證書 PDF:</strong></p>
            <a
              href={file.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4caf50', textDecoration: 'underline' }}
            >
              點此下載或預覽您的著作權證書
            </a>
          </InfoBlock>
        )}

        {file?.publicImageUrl && (
          <InfoBlock>
            <p><strong>公開圖片連結 (含浮水印):</strong></p>
            <a
              href={file.publicImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4caf50', textDecoration: 'underline' }}
            >
              點此預覽公開的保護圖片
            </a>
          </InfoBlock>
        )}

        <ButtonRow>
          <OrangeButton onClick={handleProceedToScan} disabled={isLoading}>
            {isLoading ? '處理中...' : '下一步：開始侵權偵測 (Step 3) →'}
          </OrangeButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
