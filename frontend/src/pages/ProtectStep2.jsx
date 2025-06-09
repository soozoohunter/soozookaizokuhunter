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

const DarkButton = styled.button`
  background: #444;
  color: #fff;
  border: 1px solid #666;
  border-radius: 6px;
  padding: 0.75rem 1.2rem;
  cursor: pointer;
  &:hover {
    background: #666;
    box-shadow: 0 0 8px #ff6f00;
  }
`;

const ErrorMsg = styled.p`
  color: red;
`;

export default function ProtectStep2() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [protectedUrl, setProtectedUrl] = useState('');
  const [loadingProtect, setLoadingProtect] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // 讀取 Step1 的資料
    const stored = localStorage.getItem('protectStep1');
    if (!stored) {
      // 若沒有 => 直接跳回 step1
      navigate('/protect/step1');
      return;
    }
    const data = JSON.parse(stored);
    setResult(data);

    async function callStep2() {
      try {
        const resp = await fetch('/api/protect/step2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: data.fileId })
        });
        const d = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(d.error || `Error ${resp.status}`);
      } catch (e) {
        console.error('[step2]', e);
        setError(e.message);
      } finally {
        setProcessing(false);
      }
    }
    callStep2();
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
    publicImageUrl
  } = result;

  const handleGoScan = () => {
    // 假設下一步就是 Step3 做掃描
    // 先把 step2 資料存一下
    const step2Data = {
      fileId, pdfUrl, fingerprint, ipfsHash, txHash, protectedUrl
    };
    localStorage.setItem('protectStep2', JSON.stringify(step2Data));
    navigate('/protect/step3');
  };

  async function handleFlickerProtect() {
    try {
      setLoadingProtect(true);
      setError('');
      setProtectedUrl('');

      const resp = await fetch('/api/protect/flickerProtectFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      });
      if(!resp.ok){
        const errData = await resp.json();
        throw new Error(errData.error || '防錄製失敗');
      }
      const data = await resp.json();
      console.log('[flickerProtectFile] =>', data);
      setProtectedUrl(data.protectedFileUrl || '');
    } catch(e){
      console.error(e);
      setError(e.message);
    } finally {
      setLoadingProtect(false);
    }
  }

  return (
    <PageWrapper>
      <Container>
        <Title>Step 2: 上傳完成 &amp; 產生證書</Title>
        {processing && <p>伺服器處理中...</p>}
        {error && !protectedUrl && <ErrorMsg>{error}</ErrorMsg>}
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
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#4caf50', textDecoration: 'underline' }}
            >
              點我下載 / Download PDF
            </a>
          </InfoBlock>
        ) : (
          <InfoBlock>
            <p>尚未生成 PDF 連結 (pdfUrl 為空)</p>
          </InfoBlock>
        )}

        {/* 若使用者想看上傳後 publicImageUrl */}
        {publicImageUrl && (
          <InfoBlock>
            <p><strong>公開圖片連結:</strong></p>
            <a
              href={publicImageUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#4caf50', textDecoration: 'underline' }}
            >
              {publicImageUrl}
            </a>
          </InfoBlock>
        )}

        {/* 防錄製 */}
        <InfoBlock style={{ backgroundColor:'#2c2c2c' }}>
          <p><strong>防側錄 / 防擷取檔案 (做法B)</strong></p>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          {protectedUrl ? (
            <div style={{ marginTop:'0.5rem' }}>
              <p>已完成防錄製處理，請點下方連結下載：</p>
              <a
                href={protectedUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color:'#f97316', textDecoration:'underline' }}
              >
                點我下載防側錄檔案
              </a>
            </div>
          ) : (
            <div style={{ marginTop:'0.5rem' }}>
              <p>點選按鈕進行防側錄/防擷取處理</p>
              <DarkButton onClick={handleFlickerProtect} disabled={loadingProtect}>
                {loadingProtect ? '處理中...' : '我要啟用防側錄'}
              </DarkButton>
            </div>
          )}
        </InfoBlock>

        <ButtonRow>
          <OrangeButton onClick={handleGoScan}>
            前往侵權偵測 (Step3) →
          </OrangeButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
