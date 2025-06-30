// frontend/src/pages/ProtectStep3.jsx (Final Production-Ready Version)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// --- 樣式定義 (請保持你現有的樣式或使用這些) ---
const PageWrapper = styled.div`
  min-height: 100vh;
  background: #1a1a1a;
  padding: 2rem 1rem;
  color: #fff;
`;
const Container = styled.div`
  width: 95%;
  max-width: 800px;
  margin: 0 auto;
  background-color: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid #444;
  padding: 2rem;
  text-align: center;
`;
const Title = styled.h2`
  color: #f97316;
  margin-bottom: 1.5rem;
`;
const InfoBlock = styled.div`
  background-color: #2a2a2a;
  border: 1px solid #444;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: left;
`;
const ErrorMsg = styled.div`
  background: #ff4444;
  color: #fff;
  padding: 1rem;
  border-radius: 6px;
`;
const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;
const NavButton = styled.button`
  background: #f97316;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  &:hover:not(:disabled) { background: #ea580c; }
  &:disabled { background: #555; cursor: not-allowed; }
`;
const spin = keyframes` to { transform: rotate(360deg); } `;
const Spinner = styled.div`
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #f97316;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

// --- 主元件 ---
export default function ProtectStep3() {
  const navigate = useNavigate();
  const location = useLocation();

  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmedLinks, setConfirmedLinks] = useState([]);

  const { taskId, fileInfo } = location.state || {};

  // 使用 useMemo 來計算結果，只有在 scanResult 改變時才重新計算
  const potentialLinks = useMemo(() => {
    if (!scanResult) return [];
    const google = scanResult.scan?.reverseImageSearch?.googleVision?.links?.map(url => ({ source: 'Google', url })) || [];
    // 這裡可以加入 Bing, TinEye 的結果
    return [...google];
  }, [scanResult]);

  // 主要的 useEffect，只負責輪詢
  useEffect(() => {
    if (!taskId) {
      setError('沒有提供掃描任務 ID。請返回並重新觸發掃描。');
      setLoading(false);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/scans/status/${taskId}`);
        if (!res.ok) return; // 暫時性錯誤，等待下一次輪詢
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(timer);
          setLoading(false);
          setScanResult(data.result);
          // 初始化已確認連結的狀態
          const initialConfirmed = data.result?.scan?.verifiedMatches?.map(match => match.pageUrl) || [];
          setConfirmedLinks(initialConfirmed);
        } else if (data.status === 'failed') {
          clearInterval(timer);
          setLoading(false);
          const errData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          setError(errData?.error || '掃描任務失敗');
        }
      } catch (err) {
        clearInterval(timer);
        setLoading(false);
        setError('無法取得掃描結果，請檢查網路連線。');
      }
    };
    
    const timer = setInterval(poll, 5000);
    poll(); // 立即執行一次，不用等待5秒

    return () => clearInterval(timer); // 元件卸載時清除計時器
  }, [taskId]);
  
  // 處理使用者手動確認侵權
  const handleConfirmLink = (url) => {
    setConfirmedLinks(prev => [...new Set([...prev, url])]);
  };
  
  // 處理使用者取消確認
  const handleRemoveLink = (url) => {
    setConfirmedLinks(prev => prev.filter(link => link !== url));
  };
  
  // 渲染內容的函式
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Spinner />
          <p style={{ marginTop: '1rem' }}>AI 侵權掃描正在執行中，請稍候...</p>
          <p style={{ fontSize: '0.8rem', color: '#aaa' }}>這可能需要幾分鐘時間，您可以離開此頁面，稍後再回來查看結果。</p>
        </>
      );
    }
    if (error) return <ErrorMsg><strong>掃描失敗：</strong>{error}</ErrorMsg>;
    if (!scanResult) return <p>暫無掃描結果，或仍在處理中。</p>;
  
    return (
      <InfoBlock>
        <h4>AI 尋獲的潛在連結 (請人工審核)</h4>
        {potentialLinks.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
            {potentialLinks.map((item, idx) => {
              const isConfirmed = confirmedLinks.includes(item.url);
              return (
                <li key={idx} style={{ background: '#333', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9', wordBreak: 'break-all', flexGrow: 1 }}>
                    [{item.source}] {item.url}
                  </a>
                  <button 
                    onClick={() => isConfirmed ? handleRemoveLink(item.url) : handleConfirmLink(item.url)}
                    style={{ background: isConfirmed ? '#f44336' : '#4caf50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {isConfirmed ? '取消確認' : '確認侵權'}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <p>恭喜！AI 未在公開網路上找到任何潛在連結。</p>}
      </InfoBlock>
    );
  };
  
  return (
    <PageWrapper>
      <Container>
        <Title>Step 3: 侵權掃描儀表板</Title>
        {renderContent()}
        <ButtonRow>
          <NavButton onClick={() => navigate(-1)}>← 返回</NavButton>
          <NavButton 
            disabled={confirmedLinks.length === 0}
            onClick={() => navigate('/protect/step4', { state: { fileInfo, confirmedLinks } })}
          >
            下一步 (已確認 {confirmedLinks.length} 項) →
          </NavButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
