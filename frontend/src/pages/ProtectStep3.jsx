import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  color: #fff;
  background-color: #111;
  min-height: 100vh;
`;
const Title = styled.h2`
  color: #FFD700;
  margin-bottom: 1rem;
`;
const InfoBlock = styled.div`
  background-color: #1e1e1e;
  border: 2px solid #ff6f00;
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
        throw new Error(data.error || '掃描失敗');
      }
      setScanResult(data);
    } catch (err) {
      console.error('[Step3 scan error]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleGoBack = () => {
    // 返回上一頁
    navigate(-1); // 或 navigate('/protect/step2')
  };

  const handleGoStep4 = () => {
    // 前往 Step4，順便將 suspiciousLinks 帶過去
    if (scanResult) {
      const { suspiciousLinks = [] } = scanResult;
      const stored2 = localStorage.getItem('protectStep2');
      const data2 = stored2 ? JSON.parse(stored2) : {};
      // 把前面 Step2 取得的 fileId/pdfUrl/fingerprint... 都傳過去
      // 再加 suspiciousLinks
      const passState = {
        ...data2,
        suspiciousLinks
      };
      navigate('/protect/step4', { state: passState });
    }
  };

  return (
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
          ) : (
            <p>沒有發現可疑連結</p>
          )}
        </InfoBlock>
      )}

      <ButtonRow>
        <NavButton onClick={handleGoBack}>← 返回上一頁</NavButton>
        {scanResult && (
          <NavButton onClick={handleGoStep4}>查看最終結果 (Step4)</NavButton>
        )}
      </ButtonRow>
    </Container>
  );
}
