// frontend/src/pages/ProtectStep3.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  padding: 2rem;
  background-color: #101010;
  color: #fff;
`;
const ContentBox = styled.div`
  max-width: 600px;
  margin: 0 auto;
  background: #1e1e1e;
  padding: 2rem;
  border-radius: 8px;
  border: 2px solid #ff6f00;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
`;
const Title = styled.h2`
  color: #ffd700;
  margin-bottom: 1rem;
`;
const InfoText = styled.p`
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
`;
const Highlight = styled.span`
  color: #f97316;
  font-weight: bold;
`;
const Button = styled.button`
  background-color: #f97316;
  color: #fff;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 1rem;
  &:hover { background-color: #ea580c; }
`;

export default function ProtectStep3() {
  const navigate = useNavigate();
  const location = useLocation();

  const [fileData, setFileData] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let data = location.state;
    if (!data || !data.fileId) {
      const stored2 = localStorage.getItem('protectStep2');
      if (stored2) {
        data = JSON.parse(stored2);
      }
    }
    if (!data || !data.fileId) {
      navigate('/protect/step2');
    } else {
      setFileData(data);
    }
  }, [location.state, navigate]);

  if (!fileData) {
    return (
      <Container>
        <ContentBox>
          <Title>Loading...</Title>
        </ContentBox>
      </Container>
    );
  }

  const { fileId, pdfUrl, fingerprint, ipfsHash, txHash } = fileData;

  const handleScan = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`/api/protect/scan/${fileId}`);
      const data = await resp.json();
      if (!resp.ok) {
        alert(data.error || 'AI real scan failed');
      } else {
        setScanResult(data.suspiciousLinks || []);
      }
    } catch (err) {
      alert('連線失敗: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    navigate('/protect/step4-infringement', {
      state: {
        fileId,
        pdfUrl,
        fingerprint,
        ipfsHash,
        txHash,
        suspiciousLinks: scanResult || []
      }
    });
  };

  return (
    <Container>
      <ContentBox>
        <Title>Step 3: AI Infringement Scan</Title>

        <InfoText>
          我們將呼叫後端 API <Highlight>/api/protect/scan/{fileId}</Highlight>，
          透過 <strong>RapidAPI</strong> (TikTok / IG / FB) 進行真實爬蟲。
        </InfoText>

        {!scanResult && (
          <Button onClick={handleScan} disabled={loading}>
            {loading ? 'Scanning...' : 'Start AI Scan'}
          </Button>
        )}

        {scanResult && (
          <>
            <InfoText>
              發現可疑連結：
              {scanResult.length === 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <Highlight>無任何可疑內容</Highlight>
                </div>
              )}
              {scanResult.map((link, idx) => (
                <div key={idx} style={{ margin: '0.25rem 0'}}>
                  <Highlight>{link}</Highlight>
                </div>
              ))}
            </InfoText>
            <Button onClick={handleNext}>Next: Final Step</Button>
          </>
        )}
      </ContentBox>
    </Container>
  );
}
