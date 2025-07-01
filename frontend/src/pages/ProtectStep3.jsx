// frontend/src/pages/ProtectStep3.jsx (Final Bulletproof Version)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const neonGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px #ff6f00; }
  50% { box-shadow: 0 0 25px #ff6f00; }
`;
const spin = keyframes` to { transform: rotate(360deg); } `;
const progressAnim = keyframes`
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 0%; }
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
  background-color: rgba(20, 20, 20, 0.8);
  width: 95%;
  max-width: 600px;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  border: 1px solid #444;
  animation: ${neonGlow} 2s ease-in-out infinite alternate;
`;
const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.2rem;
  color: #ffd700;
  font-weight: 700;
  letter-spacing: 1px;
`;
const InfoBlock = styled.div`
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;
const ErrorMsg = styled.div`
  background: #ff4444;
  color: #fff;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
`;
const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
`;
const NavButton = styled.button`
  background-color: #f97316;
  color: #fff;
  padding: 0.75rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover:not(:disabled) {
    background-color: #ea580c;
  }
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;
const Spinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  margin-right: 0.5rem;
  animation: ${spin} 0.8s linear infinite;
`;
const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
`;
const ProgressIndicator = styled.div`
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, #f97316, #ffce00);
  background-size: 200% 100%;
  animation: ${progressAnim} 1s linear infinite;
`;


// --- Helper Function to safely extract links ---
const extractLinks = (result) => {
    if (!result || !result.scan || !result.scan.reverseImageSearch) {
        return [];
    }
    const { googleVision, tineye, bing } = result.scan.reverseImageSearch;
    const links = [];
    if (googleVision && googleVision.success && Array.isArray(googleVision.links)) {
        googleVision.links.forEach(url => links.push({ source: 'Google', url }));
    }
    if (tineye && tineye.success && Array.isArray(tineye.matches)) {
        tineye.matches.forEach(match => links.push({ source: 'TinEye', url: match.url }));
    }
    if (bing && bing.success && Array.isArray(bing.links)) {
        bing.links.forEach(url => links.push({ source: 'Bing', url }));
    }
    // Remove duplicate URLs
    const uniqueLinksMap = new Map();
    links.forEach(link => {
        if (typeof link.url === 'string' && link.url.trim() !== '') {
            uniqueLinksMap.set(link.url, link);
        }
    });
    return Array.from(uniqueLinksMap.values());
};


export default function ProtectStep3() {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [scanData, setScanData] = useState(null); // Holds the full result object
    const [confirmedLinks, setConfirmedLinks] = useState([]);
    const [taskStatus, setTaskStatus] = useState('pending');

    const { taskId } = location.state || {};
    const [step1Data, setStep1Data] = useState(
        location.state && location.state.step1Data ? location.state.step1Data : null
    );

    useEffect(() => {
        if (!step1Data) {
            const stored = localStorage.getItem('protectStep1');
            if (stored) setStep1Data(JSON.parse(stored));
        }
    }, [step1Data]);

    useEffect(() => {
        if (!taskId) {
            setError('任務 ID 遺失，無法查詢掃描狀態。請返回重試。');
            setLoading(false);
            return;
        }

        const poll = async () => {
            try {
                const res = await fetch(`/api/scans/status/${taskId}`);
                if (!res.ok) {
                    console.warn(`Polling status ${res.status}, retrying...`);
                    return; // Don't stop polling on temporary server errors
                }
                const data = await res.json();
                if (data.status) {
                    setTaskStatus(data.status);
                }
                
                // Always update the data, even if it's just intermediate
                if (data.result) {
                    const resultData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
                    setScanData(resultData);
                }

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(timer);
                    setLoading(false);
                    if (data.status === 'failed') {
                        const errData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
                        setError((errData && errData.error) || '掃描任務執行失敗');
                    }
                }
            } catch (err) {
                clearInterval(timer);
                setLoading(false);
                setError('輪詢掃描結果時發生網路錯誤。');
            }
        };

        const timer = setInterval(poll, 5000);
        poll(); // Initial poll

        return () => clearInterval(timer);
    }, [taskId]);

    const potentialLinks = useMemo(() => extractLinks(scanData), [scanData]);

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
                    <p>掃描進行中，狀態：{taskStatus}</p>
                    <ProgressBar>
                        <ProgressIndicator />
                    </ProgressBar>
                </>
            );
        }
        if (error) {
            return <ErrorMsg><strong>錯誤：</strong>{error}</ErrorMsg>;
        }
        if (!scanData) {
            return <p>暫無掃描結果。</p>;
        }

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
                        })
                    </ul>
                ) : <p>恭喜！AI 未在公開網路上找到任何潛在連結。</p>
            </InfoBlock>
        );
    };

    return (
        <PageWrapper>
            <Container>
                <Title>Step 3: 侵權掃描儀表板</Title>
                {renderContent()}
                <ButtonRow>
                    <NavButton onClick={() => navigate('/protect/step2', { state: { step1Data } })}>← 返回修改</NavButton>
                    <NavButton
                        onClick={() => navigate('/protect/step4', { state: { fileInfo: step1Data.file, userInfo: step1Data.user, confirmedLinks } })}
                        disabled={confirmedLinks.length === 0}
                    >
                        下一步 (已確認 {confirmedLinks.length} 項) →
                    </NavButton>
                </ButtonRow>
            </Container>
        </PageWrapper>
    );
}
