// frontend/src/pages/ProtectStep3.jsx (Final Production-Ready Version)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// --- 樣式定義 ---
const spin = keyframes` to { transform: rotate(360deg); } `;
const PageWrapper = styled.div`/* ... */`;
const Container = styled.div`/* ... */`;
const Title = styled.h2`/* ... */`;
const InfoBlock = styled.div`/* ... */`;
const ErrorMsg = styled.div`/* ... */`;
const ButtonRow = styled.div`/* ... */`;
const NavButton = styled.button`/* ... */`;
const Spinner = styled.div`/* ... */`;

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
    
    const timer = setInterval(poll, 5000);
    poll(); // 立即執行一次，不用等待5秒

    return () => clearInterval(timer); // 元件卸載時清除計時器
  }, [taskId]);
  
  // 提取所有潛在連結
  const potentialLinks = useMemo(() => {
    if (!scanResult) return [];
    const google = scanResult.scan?.reverseImageSearch?.googleVision?.links?.map(url => ({ source: 'Google', url })) || [];
    const tineye = scanResult.scan?.reverseImageSearch?.tineye?.matches?.map(match => ({ source: 'TinEye', url: match.url })) || [];
    const bing = scanResult.scan?.reverseImageSearch?.bing?.links?.map(url => ({ source: 'Bing', url })) || [];
    const uniqueLinksMap = new Map();
    [...google, ...tineye, ...bing].forEach(link => {
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
          <p style={{ fontSize: '0.8rem', color: '#aaa' }}>這可能需要數分鐘，您可以離開此頁面，稍後再回來查看結果。</p>
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
