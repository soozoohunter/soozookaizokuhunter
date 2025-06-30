import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

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
  const [step1Data, setStep1Data] = useState(null);
  const [internalMatches, setInternalMatches] = useState([]);
  const [fileInfoMap, setFileInfoMap] = useState({});

  // 從上一個頁面獲取觸發掃描所需的 fileId 和 fileInfo
  const fileToScan = location.state?.fileInfo;

  const highSimilarityMatches = useMemo(() => internalMatches.filter(m => m.score >= 0.8), [internalMatches]);

  const pollScanStatus = useCallback((taskId) => {
    let attempts = 0;
    const maxAttempts = 60; // 最多輪詢 5 分鐘 (60 * 5s)

    const timer = setInterval(async () => {
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        setError('掃描處理超時，請稍後再試或聯繫客服。');
        setLoading(false);
        return;
      }
      attempts++;

      try {
        const res = await fetch(`/api/scans/status/${taskId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`找不到任務 ID ${taskId}，請返回重試。`);
          }
          console.warn(`Polling failed with status ${res.status}, retrying...`);
          return;
        }

        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(timer);
          const resultData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          setScanResult(resultData);
          setInternalMatches(resultData.internalMatches?.results || []);
          localStorage.setItem('protectStep3Result', JSON.stringify(resultData));
          setLoading(false);
        } else if (data.status === 'failed') {
          clearInterval(timer);
          const resultError = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          setError(`掃描任務失敗: ${resultError.error}`);
          setLoading(false);
        }
        // 若狀態是 'pending' 或 'processing'，則繼續等待下一次輪詢
      } catch (err) {
        console.error('[Scan Poll Error]', err);
        clearInterval(timer);
        setError(err.message || '無法取得掃描結果，請檢查網路連線。');
        setLoading(false);
      }
    }, 5000); // 每 5 秒輪詢一次
  }, []);

  useEffect(() => {
    if (!fileToScan || !fileToScan.id) {
      alert('未找到需要掃描的檔案資訊，將返回第一步。');
      navigate('/protect/step1');
      return;
    }

    const triggerAndPoll = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/protect/step2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: fileToScan.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `啟動掃描失敗 (HTTP ${response.status})`);
        }

        const data = await response.json();
        const taskId = data.taskId;

        if (!taskId) {
          throw new Error('後端未回傳掃描任務 ID');
        }

        pollScanStatus(taskId);

      } catch (err) {
        console.error('[Step3 Trigger Error]', err);
        setError(err.message);
        setLoading(false);
      }
    };

    triggerAndPoll();
  }, [fileToScan, navigate, pollScanStatus]);

  useEffect(() => {
    const stored = localStorage.getItem('protectStep1');
    if (stored) {
      setStep1Data(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    highSimilarityMatches.forEach(match => {
      if (!fileInfoMap[match.id]) {
        fetch(`/api/files/${match.id}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setFileInfoMap(prev => ({ ...prev, [match.id]: data }));
            }
          })
          .catch(() => {});
      }
    });
  }, [highSimilarityMatches, fileInfoMap]);

  const handleGoBack = () => {
    navigate('/protect/step2');
  };

  const handleGoStep4 = () => {
    if (scanResult) {
      const googleLinks = Array.isArray(scanResult.imageSearch?.googleVision?.links)
        ? scanResult.imageSearch.googleVision.links
        : [];
      const tineyeMatches = Array.isArray(scanResult.imageSearch?.tineye?.matches)
        ? scanResult.imageSearch.tineye.matches
        : [];
      const tineyeLinks = tineyeMatches.map(m => m.url);
      const suspiciousLinks = [...googleLinks, ...tineyeLinks];
      navigate('/protect/step4-infringement', {
        state: {
          ...step1Data,
          scanResults: scanResult,
          suspiciousLinks
        }
      });
    }
  };

  const handleDMCATakedown = async(matchId) => {
    if(!window.confirm('確定要對此相似圖片提出 DMCA 申訴嗎？')) return;
    try {
      const res = await fetch('/api/dmca/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workId: step1Data?.fileId,
          infringingUrl: `/api/protect/view/${matchId}`
        })
      });
      const data = await res.json();
      if(res.ok){
        alert('DMCA 已提交');
      }else{
        alert(`失敗: ${data.error || '未知錯誤'}`);
      }
    } catch(e){
      alert(`錯誤: ${e.message}`);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Spinner />
          <p>AI 侵權偵測進行中...</p>
          <p>正在掃描 Google, TinEye 及各大圖庫平台，請稍候...</p>
        </>
      );
    }

    if (error) {
      return <ErrorMsg><strong>掃描失敗：</strong>{error}</ErrorMsg>;
    }

    if (scanResult) {
      const googleLinks = Array.isArray(scanResult.imageSearch?.googleVision?.links)
        ? scanResult.imageSearch.googleVision.links.map(url => ({ source: 'Google Vision', url }))
        : [];
      const tineyeLinks = Array.isArray(scanResult.imageSearch?.tineye?.matches)
        ? scanResult.imageSearch.tineye.matches.map(m => ({ source: 'TinEye', url: m.url }))
        : [];
      const allLinks = [...googleLinks, ...tineyeLinks];

      return (
        <>
          <InfoBlock>
            <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>偵測完成！</p>
            {allLinks.length > 0 ? (
              <>
                <p>發現 {allLinks.length} 個潛在的侵權或相似圖片連結：</p>
                <ul style={{ maxHeight: '200px', overflowY: 'auto', paddingLeft: '20px' }}>
                  {allLinks.map((item, idx) => (
                    <li key={idx} style={{ margin: '0.5rem 0' }}>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4caf50' }}>
                        {item.source}: {item.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>恭喜！初步掃描未在各大平台發現相似的公開圖片。</p>
            )}
          </InfoBlock>

          <div className="ai-matches-section" style={{ marginTop: '1rem' }}>
            <h3>內部資料庫 AI 相似度匹配 (待審核)</h3>
            {highSimilarityMatches.length > 0 ? (
              <div className="matches-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {highSimilarityMatches.map(match => (
                  <div key={match.id} className="match-card" style={{ border: '1px solid #555', padding: '0.5rem', borderRadius: '6px' }}>
                    <img
                      src={`/api/protect/view/${match.id}`}
                      alt={`Similar image with ID ${match.id}`}
                      className="preview-image"
                      style={{ maxWidth: '120px', display: 'block', marginBottom: '0.5rem' }}
                    />
                    <div className="match-info" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      <p><strong>檔案 ID:</strong> {match.id}</p>
                      <p><strong>相似度:</strong> {(match.score * 100).toFixed(1)}%</p>
                      {fileInfoMap[match.id]?.title && (
                        <p><strong>標題:</strong> {fileInfoMap[match.id].title}</p>
                      )}
                    </div>
                    <div className="match-actions" style={{ textAlign: 'center' }}>
                      <button onClick={() => handleDMCATakedown(match.id)}>發送 DMCA 申訴</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>在內部資料庫中未找到相似度高於 80% 的圖片。</p>
            )}
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Step 3: AI Infringement Scan</Title>
        {renderContent()}
        <ButtonRow>
          <NavButton onClick={handleGoBack} disabled={loading}>
            ← 返回上一步
          </NavButton>
          <NavButton onClick={handleGoStep4} disabled={loading || error || !scanResult}>
            查看報告與申訴 (Step 4) →
          </NavButton>
        </ButtonRow>
      </Container>
    </PageWrapper>
  );
}
