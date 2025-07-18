import React, { useState, useEffect } from 'react';
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
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.dark.accent};
  font-size: 2rem;
`;

const InfoBlock = styled.div`
  background-color: ${({ theme }) => theme.colors.dark.background};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 400px;
  overflow-y: auto;
`;

const LinkItem = styled.li`
  background: #374151;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const LinkUrl = styled.a`
  word-break: break-all;
  color: #90caf9;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const TakedownButton = styled.button`
  background-color: ${props => props.disabled ? '#555' : '#c53030'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  min-width: 160px;
  text-align: center;
  font-weight: 500;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background-color: #9b2c2c;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;

const NavButton = styled.button`
  background-color: ${({ theme }) => theme.colors.dark.primary};
  color: #fff;
  padding: 0.75rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background-color: ${({ theme }) => theme.colors.dark.primaryHover};
  }
`;

export default function ProtectStep4() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scanResults, fileInfo } = location.state || {};
  
  const [infringingLinks, setInfringingLinks] = useState([]);
  const [takedownStatus, setTakedownStatus] = useState({});

  useEffect(() => {
    if (!fileInfo || !scanResults) {
      navigate('/protect/step1');
      return;
    }
    const allLinks = scanResults.platforms?.flatMap(p => p.results.map(r => r.url)) || [];
    setInfringingLinks(allLinks);
  }, [scanResults, fileInfo, navigate]);

  const handleTakedown = async (url) => {
    if (takedownStatus[url] && takedownStatus[url].status !== 'error') return;

    setTakedownStatus(prev => ({ ...prev, [url]: { status: 'sending', message: '傳送中...' } }));

    try {
      const response = await apiClient.post('/infringement/takedown', {
        originalFileId: fileInfo.id,
        infringingUrl: url,
      });
      setTakedownStatus(prev => ({ 
        ...prev, 
        [url]: { status: 'success', message: `成功 (Case ID: ${response.data.caseId})` }
      }));
    } catch (error) {
      setTakedownStatus(prev => ({ 
        ...prev, 
        [url]: { status: 'error', message: `失敗: ${error.message}` }
      }));
    }
  };

  if (!fileInfo) return null;

  return (
    <PageWrapper>
      <Container>
        <Title>Step 4: 確認報告與一鍵申訴</Title>
        <InfoBlock>
          <h4>AI 掃描發現 {infringingLinks.length} 個疑似侵權連結：</h4>
          <p>您的原始檔案：<strong>{fileInfo.filename}</strong></p>
          <LinkList>
            {infringingLinks.map((link, index) => {
              const statusInfo = takedownStatus[link];
              const isProcessing = statusInfo && (statusInfo.status === 'sending' || statusInfo.status === 'success');
              return (
                <LinkItem key={index}>
                  <LinkUrl href={link} target="_blank" rel="noopener noreferrer">{link}</LinkUrl>
                  <TakedownButton onClick={() => handleTakedown(link)} disabled={isProcessing}>
                    {statusInfo ? statusInfo.message : '發送 DMCA 申訴'}
                  </TakedownButton>
                </LinkItem>
              );
            })}
          </LinkList>
        </InfoBlock>
        <ButtonRow>
          <NavButton onClick={() => navigate('/dashboard')}>完成並返回儀表板</NavButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
