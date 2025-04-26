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
const ErrorMsg = styled.p`
  color: red;
`;
const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
`;
const NavButton = styled.button`
  background: #444;
  color: #fff;
  border: 1px solid #666;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  &:hover {
    background: #666;
    box-shadow: 0 0 8px #ff6f00;
  }
`;

export default function ProtectStep3() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored2 = localStorage.getItem('protectStep2');
    if (!stored2) {
      navigate('/protect/step1');
      return;
    }
    const data2 = JSON.parse(stored2);
    doScan(data2.fileId);
    // eslint-disable-next-line
  }, []);

  async function doScan(fileId) {
    try {
      setLoading(true);
      setError('');

      const resp = await fetch(`/api/protect/scan/${fileId}`);
      const data = await resp.json();

      if (!resp.ok) {
        switch(resp.status){
          case 400:
            throw new Error(data.error || '搜尋參數有誤 (400)');
          case 404:
            throw new Error(data.error || '找不到檔案 (404)');
          case 409:
            throw new Error(data.error || '本系統已存在相同著作 (409)');
          case 413:
            throw new Error(data.error || '檔案過大 (413)');
          case 500:
            throw new Error(data.error || '伺服器錯誤 (500)');
          default:
            throw new Error(data.error || `掃描失敗，狀態碼 ${resp.status}`);
        }
      }

      // 正常
      setScanResult(data);

    } catch (err) {
      console.error('[Step3 scan error]', err);
      setError(err.message || '掃描時發生未知錯誤');
    } finally {
      setLoading(false);
    }
  }

  const handleGoBack = () => {
    navigate(-1);
  };
  const handleGoStep4 = () => {
    if (scanResult) {
      const { suspiciousLinks=[] } = scanResult;
      const data2 = JSON.parse(localStorage.getItem('protectStep2') || '{}');
      const passState = { ...data2, suspiciousLinks };
      // 修正路由 => step4-infringement
      navigate('/protect/step4-infringement', { state: passState });
    }
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Step 3: 侵權偵測 (Scan)</Title>
        {loading && <p>偵測中，請稍後...</p>}
        {error && <ErrorMsg>{error}</ErrorMsg>}

        {scanResult && (
          <InfoBlock>
            <p>偵測完成！</p>
            <p><strong>Suspicious Links:</strong></p>
            {scanResult.suspiciousLinks?.length ? (
              <ul>
                {scanResult.suspiciousLinks.map((link, idx) => (
                  <li key={idx}>
                    <a href={link} target="_blank" rel="noreferrer" style={{ color: '#4caf50' }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            ) : <p>沒有發現可疑連結</p>}
          </InfoBlock>
        )}

        <ButtonRow>
          <NavButton onClick={handleGoBack}>← 返回上一頁</NavButton>
          {scanResult && (
            <NavButton onClick={handleGoStep4}>查看最終結果 (Step4)</NavButton>
          )}
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
