import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import apiClient from '../services/apiClient';

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const neonGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px #ff6f00; }
  50% { box-shadow: 0 0 25px #ff6f00; }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(-45deg, #202020, #1a1a1a, #2a2a2a, #0f0f0f);
  background-size: 500% 500%;
  animation: ${gradientFlow} 10s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  padding: 2rem;
`;
const Container = styled.div`
  background-color: rgba(20, 20, 20, 0.85);
  width: 95%;
  max-width: 800px;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  border: 1px solid #444;
  animation: ${neonGlow} 2s ease-in-out infinite alternate;
`;
const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.2rem;
  color: #ffd700;
  font-weight: 700;
  letter-spacing: 1px;
`;
const ErrorContainer = styled.div`
  text-align: center;
  color: #ff6b6b;
`;
const OrangeButton = styled.button`
  background-color: #f97316;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover:not(:disabled) {
    background-color: #ea580c;
  }
`;
const ProgressBarContainer = styled.div`
  position: relative;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
`;
const ProgressBarFill = styled.div`
  width: ${props => props.$progress || 0}%;
  height: 100%;
  background: linear-gradient(90deg, #f97316, #ffce00);
  transition: width 0.5s ease;
`;
const ProgressText = styled.span`
  display: block;
  text-align: center;
  margin-top: 0.5rem;
`;
const StatusMessage = styled.p`
  text-align: center;
  margin-top: 1rem;
`;
const ScanInfo = styled.div`
  margin-top: 1rem;
  text-align: center;
  color: #ccc;
`;
const SuccessMessage = styled.p`
  text-align: center;
  color: #4ade80;
  font-weight: bold;
`;

export default function ProtectStep3() {
  const navigate = useNavigate();
  const { scanId, file } = useLocation().state || {};
  const [scanStatus, setScanStatus] = useState('pending');
  const [scanResults, setScanResults] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  useEffect(() => {
    if (!scanId || !file) {
      setError('缺少掃描ID或檔案資訊');
      return;
    }

    const checkScanStatus = async () => {
      try {
        const res = await apiClient.get(`/scans/${scanId}/status`);
        const { status, result } = res.data;
        setScanStatus(status);
        if (status === 'completed') {
          setScanResults(result);
          clearInterval(progressRef.current);
          return;
        }
        if (status === 'processing') {
          setProgress(p => Math.min(p + 10, 90));
        }
      } catch (err) {
        setError('獲取掃描狀態失敗: ' + err.message);
        clearInterval(progressRef.current);
      }
    };

    checkScanStatus();
    progressRef.current = setInterval(checkScanStatus, 5000);
    return () => clearInterval(progressRef.current);
  }, [scanId, file]);

  const renderResults = () => {
    if (!scanResults) return null;
    return (
      <div className="results-container">
        <h3>掃描結果</h3>
        {scanResults.platforms?.map((platform, index) => (
          <div key={index} className="platform-results">
            <h4>{platform.name}</h4>
            <ul>
              {platform.results.map((result, idx) => (
                <li key={idx}>
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    {result.url}
                  </a>
                  <span> 相似度: {result.similarity}%</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Step 3: 侵權掃描儀表板</Title>
        {error ? (
          <ErrorContainer>
            <p>{error}</p>
            <OrangeButton onClick={() => window.location.reload()}>重新載入</OrangeButton>
          </ErrorContainer>
        ) : scanStatus === 'completed' ? (
          <div>
            <SuccessMessage>掃描完成！</SuccessMessage>
            {renderResults()}
            <OrangeButton onClick={() => navigate('/dashboard')}>前往儀表板</OrangeButton>
          </div>
        ) : (
          <div>
            <ProgressBarContainer>
              <ProgressBarFill $progress={progress} />
            </ProgressBarContainer>
            <ProgressText>{progress}%</ProgressText>
            <StatusMessage>
              {scanStatus === 'pending' ? '任務排隊中，請稍候...' : '正在進行全網掃描...'}
            </StatusMessage>
            <ScanInfo>
              <p>掃描 ID: {scanId}</p>
              <p>檔案: {file?.filename}</p>
            </ScanInfo>
          </div>
        )}
      </Container>
    </PageWrapper>
  );
}
