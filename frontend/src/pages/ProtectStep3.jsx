import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

/* (此處的 styled-components keyframes 與樣式維持原樣，故省略以節省篇幅) */
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
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  text-align: center;
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
  text-align: left;
`;

const ErrorMsg = styled.div`
  background: #ff4444;
  color: #fff;
  padding: 0.8rem 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  text-align: center;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const NavButton = styled.button`
  background: #f97316;
  color: #fff;
  border: 1px solid #ffaa00;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  &:hover:not(:disabled) {
    background: #ea580c;
    box-shadow: 0 0 8px #ff6f00;
  }
  &:disabled {
    background: #555;
    cursor: not-allowed;
    border-color: #666;
  }
`;

const Spinner = styled.div`
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 4px solid #fff;
  border-top: 4px solid #f97316;
  border-radius: 50%;
  margin: 1rem auto;
  animation: ${spin} 1s linear infinite;
`;

export default function ProtectStep3() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step1Data, setStep1Data] = useState(null);

  useEffect(() => {
    const storedData = localStorage.getItem('protectStep1');
    if (!storedData) {
      navigate('/protect/step1');
      return;
    }
    const parsedData = JSON.parse(storedData);
    setStep1Data(parsedData);
    // 進入頁面後自動開始掃描
    doScan(parsedData.fileId);
  }, [navigate]);

  async function doScan(fileId) {
    try {
      setLoading(true);
      setError('');

      // 正確呼叫後端掃描 API
      const response = await fetch('/api/protect/step2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });
      
      // 後端回傳一般 JSON，因此直接解析即可
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Scan failed with status: ${response.status}`);
      }

      setScanResult(data.results);
      localStorage.setItem('protectStep3', JSON.stringify({ scanResults: data.results }));

    } catch (err) {
      console.error('[Step3 Scan Error]', err);
      setError(err.message || 'An unknown error occurred during the scan.');
    } finally {
      setLoading(false);
    }
  }

  const handleGoBack = () => {
    navigate('/protect/step2');
  };

  const handleGoStep4 = () => {
    if (scanResult) {
      const googleLinks = Array.isArray(scanResult.imageSearch?.googleVision?.links)
        ? scanResult.imageSearch.googleVision.links
        : [];
      const tineyeMatches = Array.isArray(scanResult.imageSearch?.tineye?.matches)
        ? scanResult.imageSearch.tineye.matches
        : [];
      const tineyeLinks = tineyeMatches.map(m => m.url);
      const suspiciousLinks = [...googleLinks, ...tineyeLinks];
      navigate('/protect/step4-infringement', {
        state: {
          ...step1Data,
          scanResults: scanResult,
          suspiciousLinks
        }
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Spinner />
          <p>AI 侵權偵測進行中...</p>
          <p>正在掃描 Google, TinEye 及各大圖庫平台，請稍候...</p>
        </>
      );
    }

    if (error) {
      return <ErrorMsg><strong>掃描失敗：</strong>{error}</ErrorMsg>;
    }

    if (scanResult) {
      const googleLinks = Array.isArray(scanResult.imageSearch?.googleVision?.links)
        ? scanResult.imageSearch.googleVision.links.map(url => ({ source: 'Google Vision', url }))
        : [];
      const tineyeLinks = Array.isArray(scanResult.imageSearch?.tineye?.matches)
        ? scanResult.imageSearch.tineye.matches.map(m => ({ source: 'TinEye', url: m.url }))
        : [];
      const allLinks = [...googleLinks, ...tineyeLinks];

      return (
        <InfoBlock>
          <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>偵測完成！</p>
          {allLinks.length > 0 ? (
            <>
              <p>發現 {allLinks.length} 個潛在的侵權或相似圖片連結：</p>
              <ul style={{ maxHeight: '200px', overflowY: 'auto', paddingLeft: '20px' }}>
                {allLinks.map((item, idx) => (
                  <li key={idx} style={{ margin: '0.5rem 0' }}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4caf50' }}>
                      {item.source}: {item.url}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>恭喜！初步掃描未在各大平台發現相似的公開圖片。</p>
          )}
        </InfoBlock>
      );
    }

    return null;
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Step 3: AI Infringement Scan</Title>
        {renderContent()}
        <ButtonRow>
          <NavButton onClick={handleGoBack} disabled={loading}>
            ← 返回上一步
          </NavButton>
          <NavButton onClick={handleGoStep4} disabled={loading || error || !scanResult}>
            查看報告與申訴 (Step 4) →
          </NavButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
