import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
const ContentBox = styled.div`
  width: 95%;
  max-width: 600px;
  background: rgba(30, 30, 30, 0.8);
  padding: 2rem;
  border-radius: 8px;
  border: 2px solid #ff6f00;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
  animation: ${neonGlow} 2s ease-in-out infinite alternate;
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
  &:hover {
    background-color: #ea580c;
    box-shadow: 0 0 8px #ff6f00;
  }
`;

export default function ProtectStep4Infringement() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    // 若無 fileId，代表不是正規流程進來 → 導回 Step1
    if (!state || !state.fileId) {
      navigate('/protect/step1');
    } else {
      setInfo(state);
    }
  }, [state, navigate]);

  if (!info) {
    return (
      <PageWrapper>
        <ContentBox>
          <Title>Oops</Title>
          <p>無法取得資訊，請從 Step1 開始</p>
          <Button onClick={() => navigate('/protect/step1')}>Go Step1</Button>
        </ContentBox>
      </PageWrapper>
    );
  }

  const {
    fileId,
    fingerprint,
    ipfsHash,
    txHash,
    suspiciousLinks = [],
    // ★ 後端回傳的 PDF 連結 (可直接打開/下載)
    scanReportUrl
  } = info;

  /**
   * 直接下載 PDF
   */
  const handleDownloadScanPdf = () => {
    if (!scanReportUrl) {
      alert('無法找到「侵權偵測報告 PDF」的下載連結');
      return;
    }
    // 直接觸發 <a download> 行為
    const link = document.createElement('a');
    link.href = scanReportUrl;
    // 下載時預設檔名，亦可自訂
    link.download = scanReportUrl.split('/').pop() || 'KaiShield_ScanReport.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageWrapper>
      <ContentBox>
        <Title>Step 4: Final Result</Title>
        <InfoText>
          FileID: <Highlight>{fileId}</Highlight><br/>
          Fingerprint: <Highlight>{fingerprint}</Highlight><br/>
          IPFS Hash: <Highlight>{ipfsHash || '(None)'}</Highlight><br/>
          Tx Hash: <Highlight>{txHash || '(None)'}</Highlight><br/>
        </InfoText>

        <InfoText>
          <strong>侵權掃描結果：</strong>
        </InfoText>
        {suspiciousLinks.length > 0 ? (
          suspiciousLinks.map((link, idx) => (
            <div key={idx} style={{ margin: '0.25rem 0'}}>
              <Highlight>{link}</Highlight>
            </div>
          ))
        ) : (
          <div style={{ marginTop: '0.5rem' }}>
            <Highlight>尚未發現可疑連結</Highlight>
          </div>
        )}

        <div style={{ marginTop:'1.5rem' }}>
          <Button onClick={handleDownloadScanPdf}>
            下載侵權偵測報告
          </Button>

          <Button onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </ContentBox>
    </PageWrapper>
  );
}
