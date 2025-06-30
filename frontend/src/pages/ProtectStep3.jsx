// frontend/src/pages/ProtectStep3.jsx (Final Production-Ready Version)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// --- 樣式定義 ---
const spin = keyframes` to { transform: rotate(360deg); } `;
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
  background: #c53030;
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
  transition: background-color 0.2s;
  &:hover:not(:disabled) { background: #ea580c; }
  &:disabled { background: #555; color: #999; cursor: not-allowed; }
`;
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [confirmedLinks, setConfirmedLinks] = useState([]);

  const { taskId, fileInfo } = location.state || {};
  
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
        if (!res.ok) {
            if (res.status === 404) throw new Error(`找不到任務 ID ${taskId}，請返回重試。`);
            console.warn(`Polling failed with status ${res.status}, retrying...`);
            return; 
        }
        
        const data = await res.json();
        
        if (data.status === 'completed') {
          clearInterval(timer);
          setLoading(false);
          const resultData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          setScanResult(resultData);
        } else if (data.status === 'failed') {
          clearInterval(timer);
          setLoading(false);
          const errData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          setError(errData?.error || '掃描任務執行失敗');
        }
      } catch (err) {
        clearInterval(timer);
        setLoading(false);
        setError(err.message || '無法取得掃描結果，請檢查網路連線。');
      }
    };
    
    const timer = setInterval(poll, 5000); // 每 5 秒輪詢一次
    poll(); // 立即執行一次，不用等待5秒

    return () => clearInterval(timer); // 元件卸載時清除計時器
  }, [taskId]);
  
  // [核心修正] 調整 useMemo 的資料來源
  const potentialLinks = useMemo(() => {
    if (!scanResult || !scanResult.scan || !scanResult.scan.reverseImageSearch) {
      return [];
    }

    const { googleVision, tineye, bing } = scanResult.scan.reverseImageSearch;

    const googleLinks = googleVision?.links?.map(url => ({ source: 'Google', url })) || [];
    const tineyeLinks = tineye?.matches?.map(match => ({ source: 'TinEye', url: match.url })) || [];
    const bingLinks = bing?.links?.map(url => ({ source: 'Bing', url })) || [];

    // 使用 Map 來過濾掉重複的 URL，確保列表的唯一性
    const uniqueLinksMap = new Map();
    [...googleLinks, ...tineyeLinks, ...bingLinks].forEach(link => {
      // 確保 URL 是有效的字串再存入
      if (typeof link.url === 'string' && link.url.trim() !== '') {
        uniqueLinksMap.set(link.url, link);
      }
    });

    return Array.from(uniqueLinksMap.values());
  }, [scanResult]);

  // 處理使用者手動確認/取消確認連結
  const toggleLinkConfirmation = (url) => {
    setConfirmedLinks(prev => 
      prev.includes(url) ? prev.filter(l => l !== url) : [...prev, url]
    );
  };
  
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
                    onClick={() => toggleLinkConfirmation(item.url)}
                    style={{ background: isConfirmed ? '#c53030' : '#2f855a', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', minWidth: '80px' }}
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
            onClick={() => navigate('/protect/step4', { state: { fileInfo, confirmedLinks } })}
            disabled={confirmedLinks.length === 0}
          >
            下一步 (已確認 {confirmedLinks.length} 項) →
          </NavButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
