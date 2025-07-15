import React, { useState, useEffect } from 'react';
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
`;
const Container = styled.div`
  width: 95%;
  max-width: 800px;
  background: rgba(30, 30, 30, 0.8);
  padding: 2rem 2.5rem;
  border-radius: 12px;
  border: 1px solid #444;
  animation: ${neonGlow} 2s ease-in-out infinite alternate;
`;
const Title = styled.h2`
  color: #ffd700;
  margin-bottom: 1rem;
  text-align: center;
`;
const InfoBlock = styled.div`
  background-color: #1e1e1e;
  border: 1px solid #333;
  padding: 1.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
`;
const LinkList = styled.ul`
    list-style: none;
    padding: 0;
    max-height: 400px;
    overflow-y: auto;
`;
const LinkItem = styled.li`
    background: #333;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.9rem;
`;
const LinkUrl = styled.span`
    word-break: break-all;
    flex-grow: 1;
    color: #90caf9;
`;
const ActionButton = styled.button`
    background-color: ${props => props.disabled ? '#555' : '#c53030'};
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    min-width: 150px;
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
  margin-top: 1.5rem;
`;
const NavButton = styled.button`
  background-color: #f97316;
  color: #fff;
  padding: 0.75rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background-color: #ea580c;
  }
`;

export default function ProtectStep4() {
  const navigate = useNavigate();
  const location = useLocation();

  const [confirmedLinks, setConfirmedLinks] = useState(location.state?.confirmedLinks || []);
  const [fileInfo, setFileInfo] = useState(location.state?.fileInfo || null);
  const [takedownStatus, setTakedownStatus] = useState({});

  useEffect(() => {
    if (!fileInfo || confirmedLinks.length === 0) {
        alert("缺少申訴所需的檔案資訊或確認連結，將返回第一步。");
        navigate('/protect/step1');
    }
  }, [confirmedLinks, fileInfo, navigate]);

  const handleTakedown = async (infringingUrl) => {
    if (takedownStatus[infringingUrl] && takedownStatus[infringingUrl].status !== 'error') return;

    setTakedownStatus(prev => ({ ...prev, [infringingUrl]: { status: 'sending', message: '傳送中...' } }));

    try {
      const response = await apiClient.post('/infringement/takedown', {
        originalFileId: fileInfo.id,
        infringingUrl,
      });
      const result = response.data;
      setTakedownStatus(prev => ({ 
          ...prev, 
          [infringingUrl]: { status: 'success', message: `成功 (Case ID: ${result.caseId})` }
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.error || '申訴請求失敗';
      setTakedownStatus(prev => ({ 
          ...prev, 
          [infringingUrl]: { status: 'error', message: `失敗: ${errorMessage}` }
      }));
    }
  };
  
  if (!fileInfo || confirmedLinks.length === 0) {
      return (
        <PageWrapper>
            <Container>
                <Title>正在載入資料...</Title>
            </Container>
        </PageWrapper>
      );
  }

  return (
    <PageWrapper>
      <Container>
        <Title>Step 4: 確認報告與一鍵申訴</Title>
        <InfoBlock>
          <h4>您已確認以下 {confirmedLinks.length} 個連結為侵權內容：</h4>
          <p>您的原始檔案：<strong>{fileInfo.filename} (ID: {fileInfo.id})</strong></p>
          <p style={{fontSize: '0.8rem', color: '#ccc'}}>點擊按鈕後，系統將透過 DMCA.com 的 API 發送下架通知。</p>
          <LinkList>
            {confirmedLinks.map((link, index) => {
              const statusInfo = takedownStatus[link];
              const isProcessing = statusInfo && (statusInfo.status === 'sending' || statusInfo.status === 'success');

              return (
                <LinkItem key={index}>
                  <LinkUrl>{link}</LinkUrl>
                  <ActionButton onClick={() => handleTakedown(link)} disabled={isProcessing}>
                    {statusInfo ? statusInfo.message : '發送 DMCA 申訴'}
                  </ActionButton>
                </LinkItem>
              );
            })}
          </LinkList>
        </InfoBlock>
        <ButtonRow>
          <NavButton onClick={() => navigate(-1)}>← 返回修改</NavButton>
          <NavButton onClick={() => navigate('/')}>完成並返回首頁</NavButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
