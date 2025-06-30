import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// --- 樣式定義 (保持不變) ---
const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const neonGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px #ff6f00;
  }
  50% {
    box-shadow: 0 0 25px #ff6f00;
  }
`;
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(-45deg, #202020, #1a1a1a, #2a2a2a, #0f0f0f);
  background-size: 500% 500%;
  animation: ${gradientFlow} 12s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;
const Container = styled.div`
  width: 95%;
  max-width: 600px;
  background-color: rgba(30, 30, 30, 0.8);
  border-radius: 12px;
  border: 2px solid #ff6f00;
  padding: 2rem;
  animation: ${neonGlow} 2s ease-in-out infinite alternate;
  text-align: center;
`;
const Title = styled.h2`
  color: #FFD700;
  margin-bottom: 1rem;
  text-align: center;
`;
const InfoBlock = styled.div`
  background-color: #1e1e1e;
  border: 1px solid #ff6f00;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  word-break: break-all;
  text-align: left;
`;
const ErrorMsg = styled.div`
  background: #ff4444;
  color: #fff;
  padding: 0.8rem 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  text-align: center;
`;
const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;
const NavButton = styled.button`
  background: #f97316;
  color: #fff;
  border: 1px solid #ffaa00;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  &:hover:not(:disabled) {
    background: #ea580c;
    box-shadow: 0 0 8px #ff6f00;
  }
  &:disabled {
    background: #555;
    cursor: not-allowed;
    border-color: #666;
  }
`;
const Spinner = styled.div`
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 4px solid #fff;
  border-top: 4px solid #f97316;
  border-radius: 50%;
  margin: 1rem auto;
  animation: ${spin} 1s linear infinite;
`;

export default function ProtectStep3() {
  const navigate = useNavigate();
  const location = useLocation();

  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [internalMatches, setInternalMatches] = useState([]);
  const [fileInfoMap, setFileInfoMap] = useState({});
  const [linkItems, setLinkItems] = useState([]); // {source,url,status}
  const [matchStatus, setMatchStatus] = useState({}); // id -> status
  const [confirmedMatches, setConfirmedMatches] = useState([]);

  // 從路由狀態中獲取上一步傳來的檔案資訊和任務ID
  const fileData = location.state?.fileInfo;
  const taskId = location.state?.taskId;

  const highSimilarityMatches = useMemo(() =>
    (internalMatches || []).filter(match => match.score >= 0.8),
    [internalMatches]
  );

  const allPotentialLinks = useMemo(() => {
    if (!scanResult) return [];
    const googleLinks =
      scanResult.scan?.reverseImageSearch?.googleVision?.links?.map(url => ({
        source: 'Google',
        url,
      })) || [];
    const tineyeLinks =
      scanResult.scan?.reverseImageSearch?.tineye?.matches?.map(m => ({
        source: 'TinEye',
        url: m.url,
      })) || [];
    const bingLinks =
      scanResult.scan?.reverseImageSearch?.bing?.links?.map(url => ({
        source: 'Bing',
        url,
      })) || [];
    return [...googleLinks, ...tineyeLinks, ...bingLinks];
  }, [scanResult]);

  useEffect(() => {
    const items = allPotentialLinks.map(l => ({ ...l, status: 'pending' }));
    setLinkItems(items);
  }, [allPotentialLinks]);

  const fetchMatchDetails = useCallback(() => {
    highSimilarityMatches.forEach(match => {
      if (!fileInfoMap[match.id]) {
        fetch(`/api/files/${match.id}`)
          .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch file info')))
          .then(data => {
            if (data) {
              setFileInfoMap(prev => ({ ...prev, [match.id]: data }));
            }
          })
          .catch(err => console.error(`Failed to fetch info for file ${match.id}:`, err));
      }
    });
  }, [highSimilarityMatches, fileInfoMap]);

  useEffect(() => {
    fetchMatchDetails();
  }, [fetchMatchDetails]);

  useEffect(() => {
    if (!taskId) {
      setError('沒有提供掃描任務 ID。請返回並重新觸發掃描。');
      setLoading(false);
      return;
    }

    const pollScanStatus = () => {
      let attempts = 0;
      const maxAttempts = 60; // Poll for 5 minutes max

      const timer = setInterval(async () => {
        if (attempts >= maxAttempts) {
          clearInterval(timer);
          setError('掃描處理超時，請稍後於儀表板查看結果。');
          setLoading(false);
          return;
        }
        attempts++;

        try {
          const res = await fetch(`/api/scans/status/${taskId}`);
          if (!res.ok) {
            console.warn(`Polling failed with status ${res.status}, retrying...`);
            return; // Continue polling on non-fatal errors
          }
          
          const data = await res.json();
          
          if (data.status === 'completed') {
            clearInterval(timer);
            const resultData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            setScanResult(resultData);
            setInternalMatches(resultData.internalMatches?.results || []);
            localStorage.setItem(`scanResult_${taskId}`, JSON.stringify(resultData));
            setLoading(false);
          } else if (data.status === 'failed') {
            clearInterval(timer);
            const errData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            setError(`掃描任務失敗: ${errData.error || '未知錯誤'}`);
            setLoading(false);
          }
        } catch (err) {
          clearInterval(timer);
          setError(err.message || '無法取得掃描結果，請檢查網路連線。');
          setLoading(false);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(timer); // Cleanup function for useEffect
    };

    pollScanStatus();
  }, [taskId]);


  const confirmLink = (idx) => {
    setLinkItems(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx].status = 'confirmed';
      }
      return next;
    });
  };

  const ignoreLink = (idx) => {
    setLinkItems(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx].status = 'ignored';
      }
      return next;
    });
  };

  const confirmMatch = (id) => {
    setMatchStatus(prev => ({ ...prev, [id]: 'confirmed' }));
    setConfirmedMatches(c => [...c, id]);
  };

  const ignoreMatch = (id) => {
    setMatchStatus(prev => ({ ...prev, [id]: 'ignored' }));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Spinner />
          <p>AI 侵權偵測進行中...</p>
          <p>正在掃描 Google, TinEye, Bing 及內部資料庫，請稍候...</p>
        </>
      );
    }
    if (error) return <ErrorMsg><strong>掃描失敗：</strong>{error}</ErrorMsg>;
    if (!scanResult) return <p>暫無掃描結果。</p>;

    return (
      <>
        <InfoBlock>
          <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>偵測完成！</p>
          <h4>AI 尋獲的潛在連結 (待人工審核)</h4>
          {linkItems.length > 0 ? (
            <ul style={{ maxHeight: '200px', overflowY: 'auto', paddingLeft: '20px' }}>
              {linkItems.filter(l => l.status !== 'ignored').map((item, idx) => (
                <li key={idx} style={{ margin: '0.5rem 0', display:'flex', alignItems:'center' }}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#66bb6a', wordBreak:'break-all', flex:1 }}>
                    [{item.source}] {item.url}
                  </a>
                  {item.status === 'pending' && (
                    <>
                      <button style={{ marginLeft: '0.5rem', background:'#22c55e', color:'#000' }} onClick={() => confirmLink(idx)}>
                        確認為侵權
                      </button>
                      <button style={{ marginLeft: '0.5rem', background:'#666', color:'#fff' }} onClick={() => ignoreLink(idx)}>
                        標示為無關
                      </button>
                    </>
                  )}
                  {item.status === 'confirmed' && <span style={{ marginLeft:'0.5rem', color:'#22c55e' }}>已確認</span>}
                </li>
              ))}
            </ul>
          ) : <p>恭喜！初步掃描未在各大平台發現相似的公開圖片。</p>}
        </InfoBlock>
        <div className="ai-matches-section" style={{ marginTop: '2rem' }}>
          <h4>內部資料庫 AI 相似度匹配 (>{'80%'})</h4>
          {highSimilarityMatches.length > 0 ? (
            <div className="matches-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              {highSimilarityMatches.filter(m => matchStatus[m.id] !== 'ignored').map(match => {
                const status = matchStatus[match.id] || 'pending';
                return (
                  <div key={match.id} style={{ border:'1px solid #555', padding:'0.5rem' }}>
                    <img src={`/api/protect/view/${match.id}`} alt="match" style={{ width:'120px', height:'120px', objectFit:'cover' }} />
                    <div style={{ fontSize:'0.9rem', marginTop:'0.5rem' }}>
                      <p><strong>檔案 ID:</strong> {match.id}</p>
                      <p><strong>相似度:</strong> {(match.score * 100).toFixed(1)}%</p>
                      {fileInfoMap[match.id]?.title && <p><strong>標題:</strong> {fileInfoMap[match.id].title}</p>}
                    </div>
                    {status === 'pending' && (
                      <div style={{ marginTop:'0.5rem' }}>
                        <button style={{ background:'#22c55e', color:'#000', marginRight:'0.25rem' }} onClick={() => confirmMatch(match.id)}>確認為侵權</button>
                        <button style={{ background:'#666', color:'#fff' }} onClick={() => ignoreMatch(match.id)}>標示為無關</button>
                      </div>
                    )}
                    {status === 'confirmed' && <div style={{ color:'#22c55e', marginTop:'0.5rem' }}>已確認</div>}
                  </div>
                );
              })}
            </div>
          ) : <p>在內部資料庫中未找到相似度高於 80% 的圖片。</p>}
        </div>
      </>
    );
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Step 3: AI Infringement Scan</Title>
        {renderContent()}
        <ButtonRow>
          <NavButton onClick={() => navigate(-1)} disabled={loading}>
            ← 返回
          </NavButton>
          <NavButton
            onClick={() =>
              navigate('/protect/step4-infringement', {
                state: {
                  ...fileData,
                  suspiciousLinks: [
                    ...linkItems.filter(l => l.status !== 'ignored').map(l => l.url),
                    ...confirmedMatches.map(id => `/api/protect/view/${id}`)
                  ],
                  scanReportUrl: scanResult?.scanReportUrl
                }
              })
            }
            disabled={
              loading ||
              error ||
              linkItems.filter(l => l.status !== 'ignored').length === 0
            }
          >
            查看報告與申訴 (Step 4) →
          </NavButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
