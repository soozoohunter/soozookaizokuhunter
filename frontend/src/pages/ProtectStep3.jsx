import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '../apiClient';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.dark.card};
  width: 100%;
  max-width: 700px;
  padding: 2.5rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.dark.accent};
  font-size: 2rem;
`;

const ProgressBarContainer = styled.div`
  position: relative;
  height: 10px;
  background: #333;
  border-radius: 5px;
  overflow: hidden;
  margin: 2rem 0 1rem;
`;

const ProgressBarFill = styled.div`
  width: ${props => props.progress || 0}%;
  height: 100%;
  background: linear-gradient(90deg, #f97316, #ffce00);
  transition: width 0.5s ease;
`;

const StatusMessage = styled.p`
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
`;

export default function ProtectStep3() {
  const navigate = useNavigate();
  const { scanId, file } = useLocation().state || {};
  const [scanStatus, setScanStatus] = useState('pending');
  const [scanResults, setScanResults] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!scanId || !file) {
      navigate('/protect/step1');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await apiClient.get(`/scans/${scanId}/status`);
        const { status, result } = res.data;
        setScanStatus(status);
        
        if (status === 'processing') {
          setProgress(p => Math.min(p + 15, 90));
        } else if (status === 'completed') {
          setProgress(100);
          setScanResults(result);
          clearInterval(intervalRef.current);
          setTimeout(() => {
            navigate('/protect/step4', { state: { scanResults: result, fileInfo: file } });
          }, 1500);
        } else if (status === 'failed') {
            setError('掃描任務失敗，請稍後再試。');
            clearInterval(intervalRef.current);
        }
      } catch (err) {
        setError('獲取掃描狀態失敗。');
        clearInterval(intervalRef.current);
      }
    };

    setProgress(10);
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 5000);

    return () => clearInterval(intervalRef.current);
  }, [scanId, file, navigate]);

  const getStatusText = () => {
    if (error) return error;
    switch (scanStatus) {
      case 'pending': return '任務排隊中，請稍候...';
      case 'processing': return 'AI 正在進行全網掃描...';
      case 'completed': return '掃描完成！即將跳轉至結果頁...';
      default: return '正在初始化...';
    }
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Step 3: 侵權掃描中</Title>
        <StatusMessage>{getStatusText()}</StatusMessage>
        <ProgressBarContainer>
          <ProgressBarFill progress={progress} />
        </ProgressBarContainer>
      </Container>
    </PageWrapper>
  );
}
