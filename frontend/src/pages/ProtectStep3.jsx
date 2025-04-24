// frontend/src/pages/ProtectStep3.jsx
import React, { useState } from 'react';
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
  const { state } = useLocation();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!state || !state.fileId) {
    return (
      <Container>
        <ContentBox>
          <Title>Oops</Title>
          <p>無法取得上一步資訊，請先從 Step2 開始</p>
          <Button onClick={() => navigate('/protect/step2')}>Go Step2</Button>
        </ContentBox>
      </Container>
    );
  }

  const { fileId, pdfUrl, fingerprint, ipfsHash, txHash } = state;

  const handleScan = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`/api/protect/scan/${fileId}`);
      const data = await resp.json();
      if (!resp.ok) {
        alert(data.error || 'AI Scan failed');
      } else {
        setScanResult(data.suspiciousLinks || []);
      }
    } catch (err) {
      alert('連線失敗');
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
          這裡會呼叫後端 API `/api/protect/scan/${fileId}` 來模擬侵權掃描。
          找到可疑的盜用連結後，您就可以主張DMCA下架或法律途徑。
        </InfoText>

        {!scanResult && (
          <Button onClick={handleScan} disabled={loading}>
            {loading ? 'Scanning...' : 'Start AI Scan'}
          </Button>
        )}

        {scanResult && (
          <>
            <InfoText>
              發現可疑連結：<br />
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
