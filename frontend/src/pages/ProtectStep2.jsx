// frontend/src/pages/ProtectStep2.jsx
import React from 'react';
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

const NextButton = styled.button`
  background-color: #f97316;
  color: #fff;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background-color: #ea580c; }
`;

export default function ProtectStep2() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // 若直接進到 Step2 而沒 state，可能要導回 Step1
  if (!state || !state.fileId) {
    return (
      <Container>
        <ContentBox>
          <Title>Oops</Title>
          <p>無法取得上一步資訊，請先從 Step1 開始</p>
          <NextButton onClick={() => navigate('/protect/step1')}>Go Step1</NextButton>
        </ContentBox>
      </Container>
    );
  }

  const { fileId, pdfUrl, fingerprint, ipfsHash, txHash } = state;

  const handleNext = () => {
    // 進入 Step3，帶上 fileId
    navigate('/protect/step3', {
      state: {
        fileId,
        pdfUrl,
        fingerprint,
        ipfsHash,
        txHash
      }
    });
  };

  return (
    <Container>
      <ContentBox>
        <Title>Step 2: Blockchain Record</Title>
        <InfoText>
          您的作品已成功上傳！以下是區塊鏈紀錄資訊：<br />
          Fingerprint: <Highlight>{fingerprint}</Highlight> <br />
          IPFS Hash: <Highlight>{ipfsHash || '(None)'}</Highlight> <br />
          Tx Hash: <Highlight>{txHash || '(None)'}</Highlight> <br />
        </InfoText>

        <InfoText>
          憑證 PDF 已產生，可在最後一步下載。<br />
          (預設路徑: <Highlight>{pdfUrl}</Highlight>)
        </InfoText>

        <NextButton onClick={handleNext}>Next: AI Scan</NextButton>
      </ContentBox>
    </Container>
  );
}
