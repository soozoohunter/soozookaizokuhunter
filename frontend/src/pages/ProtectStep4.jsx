import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '../apiClient';
import { AuthContext } from '../AuthContext';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  background-color: ${({ theme }) => theme.colors.light.card};
`;

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  background: ${({ theme }) => theme.colors.light.background};
  padding: 2.5rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  box-shadow: ${({ theme }) => theme.shadows.main};
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.light.text};
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 2rem;
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  border-radius: 8px;
  padding: 0.5rem;
`;

const LinkItem = styled.li`
  background: #f9fafb;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const LinkUrl = styled.a`
  word-break: break-all;
  color: ${({ theme }) => theme.colors.light.primary};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const TakedownButton = styled.button`
  background-color: ${props => (props.disabled ? '#ccc' : '#c53030')};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  min-width: 160px;
  text-align: center;
  font-weight: 500;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background-color: #9b2c2c;
  }
`;

const AuthActionBlock = styled.div`
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: #fffbe6;
  border: 1px solid #fde68a;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-align: center;
`;

const AuthActionTitle = styled.h3`
  margin: 0 0 1rem 0;
`;

const AuthButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const AuthButton = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  background-color: ${({ theme, primary }) =>
    primary ? theme.colors.light.primary : '#FFFFFF'};
  color: ${({ theme, primary }) =>
    primary ? '#FFFFFF' : theme.colors.light.primary};
  border: 1px solid ${({ theme }) => theme.colors.light.primary};
`;

export default function ProtectStep4() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const { scanResults, fileInfo } = location.state || {};

  const [infringingLinks, setInfringingLinks] = useState([]);
  const [takedownStatus, setTakedownStatus] = useState({});

  useEffect(() => {
    if (!fileInfo || !scanResults) {
      navigate('/protect/step1');
      return;
    }
    const allLinks =
      scanResults.platforms?.flatMap(p => p.results.map(r => r.url)) || [];
    setInfringingLinks(allLinks);
  }, [scanResults, fileInfo, navigate]);

  const handleTakedown = async url => {
    if (takedownStatus[url] && takedownStatus[url].status !== 'error') return;

    setTakedownStatus(prev => ({
      ...prev,
      [url]: { status: 'sending', message: '傳送中...' }
    }));

    try {
      const response = await apiClient.post('/infringement/takedown', {
        originalFileId: fileInfo.id,
        infringingUrl: url
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

  const handleAuthRedirect = path => {
    navigate(path, {
      state: {
        from: location,
        scanResults,
        fileInfo
      }
    });
  };

  if (!fileInfo) return null;

  return (
    <PageWrapper>
      <Container>
        <Title>Step 4: 確認報告與採取行動</Title>
        <p>
          您的原始檔案：<strong>{fileInfo.filename}</strong>
        </p>
        <p>AI 掃描發現 {infringingLinks.length} 個疑似侵權連結：</p>

        <LinkList>
          {infringingLinks.map((link, index) => (
            <LinkItem key={index}>
              <LinkUrl href={link} target="_blank" rel="noopener noreferrer">
                {link}
              </LinkUrl>
              {user && (
                <TakedownButton
                  onClick={() => handleTakedown(link)}
                  disabled={takedownStatus[link]?.status === 'success'}
                >
                  {takedownStatus[link]
                    ? takedownStatus[link].message
                    : '發送 DMCA 申訴'}
                </TakedownButton>
              )}
            </LinkItem>
          ))}
        </LinkList>

        {!user && (
          <AuthActionBlock>
            <AuthActionTitle>註冊或登入以發送 DMCA 申訴</AuthActionTitle>
            <p>儲存您的掃描結果，並立即採取法律行動保護您的資產。</p>
            <AuthButtonContainer>
              <AuthButton onClick={() => handleAuthRedirect('/login')}>登入</AuthButton>
              <AuthButton primary onClick={() => handleAuthRedirect('/register')}>
                免費註冊
              </AuthButton>
            </AuthButtonContainer>
          </AuthActionBlock>
        )}
      </Container>
    </PageWrapper>
  );
}
