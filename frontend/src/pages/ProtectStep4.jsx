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

const LinkList = styled.div`
  list-style: none;
  padding: 0;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  border-radius: 8px;
  padding: 0.5rem;
  margin-top: 1rem;
`;

const LinkItem = styled.div`
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

// ★★★ 全新的 P2P 案件按鈕 ★★★
const ActionButton = styled.button`
  background-color: #A855F7; /* 紫色，代表更高價值的功能 */
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  min-width: 160px;
  text-align: center;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.2s ease;
  &:hover:not(:disabled) {
    background-color: #9333ea;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

// ★★★ 模糊化的連結樣式 ★★★
const BlurredLinkItem = styled(LinkItem)`
  color: transparent;
  text-shadow: 0 0 8px rgba(0,0,0,0.5);
  user-select: none;
  cursor: pointer;
  justify-content: center;
`;

const ActionFooter = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${({ theme }) => theme.colors.light.border};
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

export default function ProtectStep4() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { scanResults, fileInfo, trialUser } = location.state || {};

  const [infringingLinks, setInfringingLinks] = useState([]);
  const [summary, setSummary] = useState({ count: 0, sources: 0 });
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
    setSummary({
      count: uniqueLinks.length,
      sources: Object.keys(scanResults.results || {}).length
    });
  }, [scanResults, fileInfo, navigate]);
  
  const handleCreateCase = async (fileId, infringingUrl) => {
    try {
        await apiClient.post('/cases/create', { fileId, infringingUrl });
        alert('案件建立成功！您現在可以在會員中心管理此案件。');
        navigate('/dashboard');
    } catch (error) {
        alert(error.response?.data?.message || '建立案件失敗');
    }
  };
  
  const handleDownloadReport = () => {
    // 實際的下載邏輯
    alert("正在為您準備報告...");
  };

  if (!fileInfo) return null;

  const isPaidUser = user && user.role !== 'trial';

  return (
    <>
      <PageWrapper>
        <Container>
          <Title>Step 4: AI 掃描結果</Title>
          <p>您的原始檔案：<strong>{fileInfo.filename}</strong></p>
          
          <SummaryCard>
            <h3>掃描摘要</h3>
            {summary.count > 0 ? (
              <SummaryText>已在 {summary.sources} 個平台發現 {summary.count} 筆疑似侵權！</SummaryText>
            ) : (
              <SummaryText>恭喜！初步掃描未發現侵權。</SummaryText>
            )}
          </SummaryCard>

          {infringingLinks.length > 0 && (
            <div>
              <h4>詳細結果列表：</h4>
              <LinkList>
                {infringingLinks.map((link, index) => {
                  // ★★★ 核心邏輯：付費會員或前2筆，顯示清晰內容 ★★★
                  if (isPaidUser || index < 2) {
                    return (
                      <LinkItem key={index}>
                        <LinkUrl href={link} target="_blank" rel="noopener noreferrer">{link}</LinkUrl>
                        {isPaidUser && (
                          <ActionButton onClick={() => handleCreateCase(fileInfo.id, link)}>
                            建立 P2P 案件
                          </ActionButton>
                        )}
                      </LinkItem>
                    );
                  } 
                  // ★★★ 對於試用者，第3筆及之後的連結，顯示為模糊樣式 ★★★
                  else if (index < 10) { // 最多只顯示 8 條模糊連結
                    return (
                      <BlurredLinkItem key={index} onClick={() => setShowUpgradeModal(true)}>
                        [ 升級以查看此連結 ]
                      </BlurredLinkItem>
                    );
                  }
                  return null;
                })}
                {infringingLinks.length > 10 && !isPaidUser && (
                   <p style={{textAlign: 'center', color: '#6b7280'}}>...及另外 {infringingLinks.length - 10} 筆疑似連結</p>
                )}
              </LinkList>
            </div>
          )}

          <ActionFooter>
            {/* ★ 按鈕的行為根據使用者身份而變化 ★ */}
            <StyledButton 
                as="button" 
                onClick={isPaidUser ? handleDownloadReport : () => setShowUpgradeModal(true)}
            >
                下載完整侵權報告 (PDF)
            </StyledButton>
            <StyledButton 
                as="button" 
                primary 
                onClick={isPaidUser ? () => navigate('/dashboard') : () => navigate('/register', {state: {from: location, trialUser}})}
            >
                {isPaidUser ? '前往會員中心' : '免費註冊，永久保存紀錄'}
            </StyledButton>
          </ActionFooter>
        </Container>
      </PageWrapper>
      
      {/* ★ 彈窗現在只會在用戶點擊付費功能時被觸發 ★ */}
      {showUpgradeModal && <ExperienceCompleteModal onClose={() => setShowUpgradeModal(false)} />}
    </>
  );
}
