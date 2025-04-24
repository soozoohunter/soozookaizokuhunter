// frontend/src/pages/ProtectStep4Infringement.jsx
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

export default function ProtectStep4Infringement() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!state || !state.fileId) {
      // 若無 state => 回 Step1
      navigate('/protect/step1');
    } else {
      setInfo(state);
    }
  }, [state, navigate]);

  if (!info) {
    return (
      <Container>
        <ContentBox>
          <Title>Oops</Title>
          <p>無法取得資訊，請從 Step1 開始</p>
          <Button onClick={() => navigate('/protect/step1')}>Go Step1</Button>
        </ContentBox>
      </Container>
    );
  }

  const { fileId, pdfUrl, fingerprint, ipfsHash, txHash, suspiciousLinks } = info;

  const handleDownloadPdf = () => {
    if (!pdfUrl) {
      alert('無法找到 PDF URL');
      return;
    }
    // 直接開啟/下載
    window.open(pdfUrl, '_blank');
  };

  return (
    <Container>
      <ContentBox>
        <Title>Step 4: Final Proof & Infringement Links</Title>
        <InfoText>
          您的作品已完成區塊鏈上鏈與 AI 掃描，以下為最終資訊：
        </InfoText>

        <InfoText>
          FileID: <Highlight>{fileId}</Highlight><br />
          Fingerprint: <Highlight>{fingerprint}</Highlight><br />
          IPFS Hash: <Highlight>{ipfsHash || '(None)'}</Highlight><br />
          Tx Hash: <Highlight>{txHash || '(None)'}</Highlight><br />
        </InfoText>

        <InfoText>
          侵權掃描結果：<br />
          {suspiciousLinks && suspiciousLinks.length > 0 ? (
            suspiciousLinks.map((link, idx) => (
              <div key={idx} style={{ margin: '0.25rem 0'}}>
                <Highlight>{link}</Highlight>
              </div>
            ))
          ) : (
            <span>尚未偵測到可疑連結</span>
          )}
        </InfoText>

        <Button onClick={handleDownloadPdf}>
          Download Certificate PDF
        </Button>
        <Button onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </ContentBox>
    </Container>
  );
}
