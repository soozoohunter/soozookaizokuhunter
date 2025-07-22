import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '../apiClient';
import { AuthContext } from '../AuthContext';
import ExperienceCompleteModal from '../components/ExperienceCompleteModal';

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

const SummaryCard = styled.div`
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  margin: 2rem 0;
`;

const SummaryText = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.light.primary};
`;

// ★★★ 新增：為預覽列表設計的樣式 ★★★
const PreviewSection = styled.div`
  margin-top: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  border-radius: 8px;
  padding: 1.5rem;
`;

const PreviewTitle = styled.h4`
  text-align: center;
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
`;

const ClearLink = styled.div`
  padding: 0.5rem 0;
  font-family: 'Courier New', Courier, monospace;
  a {
    color: ${({ theme }) => theme.colors.light.primary};
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;

const BlurredLink = styled.div`
  padding: 0.5rem 0;
  font-family: 'Courier New', Courier, monospace;
  color: transparent;
  text-shadow: 0 0 8px rgba(0,0,0,0.5);
  user-select: none;
  cursor: pointer;
`;

const MoreLinksText = styled.p`
  text-align: center;
  font-style: italic;
  color: #6b7280;
  margin-top: 1rem;
`;

export default function ProtectStep4() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // ★★★ fileInfo, trialUser 從 step3 傳來 ★★★
  const { scanResults, fileInfo, trialUser } = location.state || {};

  const [infringingLinks, setInfringingLinks] = useState([]);
  const [summary, setSummary] = useState({ count: 0, sources: 0 });
  const [takedownStatus, setTakedownStatus] = useState({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!fileInfo || !scanResults) {
      navigate('/protect/step1');
      return;
    }

    let collectedLinks = [];
    if (scanResults && scanResults.results) {
      Object.values(scanResults.results).forEach(sourceResult => {
        if (sourceResult && sourceResult.success && Array.isArray(sourceResult.links)) {
          collectedLinks.push(...sourceResult.links);
        }
      });
    }
    const uniqueLinks = [...new Set(collectedLinks)];
    setInfringingLinks(uniqueLinks);
    // ★★★ 計算結果摘要 ★★★
    setSummary({
      count: uniqueLinks.length,
      sources: Object.keys(scanResults.results || {}).length
    });

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
        fileInfo,
        trialUser
      }
    });
  };

  if (!fileInfo) return null;

  // ★★★ 根據用戶登入狀態和角色，顯示不同內容 ★★★
  const isPaidUser = user && user.role !== 'trial';

  return (
    <>
    <PageWrapper>
      <Container>
        <Title>Step 4: 確認報告與採取行動</Title>
        <p>
          您的原始檔案：<strong>{fileInfo.filename}</strong>
        </p>
        
        {/* --- 對於付費會員，顯示完整結果 --- */}
        {isPaidUser && (
          infringingLinks.length > 0 ? (
            <>
              <p>AI 掃描發現 {infringingLinks.length} 個疑似侵權連結：</p>
              <LinkList>
                {infringingLinks.map((link, index) => (
                  <LinkItem key={index}>
                    <LinkUrl href={link} target="_blank" rel="noopener noreferrer">{link}</LinkUrl>
                    <TakedownButton>發送 DMCA 申訴</TakedownButton>
                  </LinkItem>
                ))}
              </LinkList>
            </>
          ) : (
            <p>太棒了！AI 掃描目前未在網路上發現疑似侵權的內容。</p>
          )
        )}

        {/* --- 對於未登入或試用者，顯示摘要和付費引導 --- */}
        {!isPaidUser && (
          <>
            <SummaryCard>
              <AuthActionTitle>掃描摘要</AuthActionTitle>
              {summary.count > 0 ? (
                <SummaryText>已在 {summary.sources} 個平台發現 {summary.count} 筆疑似侵權！</SummaryText>
              ) : (
                <SummaryText>恭喜！初步掃描未發現侵權。</SummaryText>
              )}
            </SummaryCard>

            {infringingLinks.length > 0 && (
              <PreviewSection>
                  <PreviewTitle>部分掃描結果預覽</PreviewTitle>
                  {infringingLinks.slice(0, 2).map((link, index) => (
                      <ClearLink key={`clear-${index}`}>
                         <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                      </ClearLink>
                  ))}
                  {infringingLinks.slice(2, 10).map((link, index) => (
                      <BlurredLink key={`blur-${index}`} onClick={() => setShowUpgradeModal(true)}>
                          https://blurred-for-preview.com/path/to/page/{index + 1}
                      </BlurredLink>
                  ))}
                  {infringingLinks.length > 10 && (
                      <MoreLinksText>...以及另外 {infringingLinks.length - 10} 個疑似連結</MoreLinksText>
                  )}
              </PreviewSection>
            )}

            <AuthActionBlock>
              <AuthActionTitle>升級帳戶以查看完整報告</AuthActionTitle>
              <p>成為正式會員，即可查看全部 {infringingLinks.length} 筆詳細報告、下載 PDF、並立即採取法律行動。</p>
              <AuthButtonContainer>
                <AuthButton onClick={() => handleAuthRedirect('/login')}>我已有帳號，前往登入</AuthButton>
                <AuthButton primary onClick={() => setShowUpgradeModal(true)}>
                  免費註冊並查看方案
                </AuthButton>
              </AuthButtonContainer>
            </AuthActionBlock>
          </>
        )}
      </Container>
    </PageWrapper>
    {showUpgradeModal && <ExperienceCompleteModal onClose={() => setShowUpgradeModal(false)} />}
    </>
  );
}
