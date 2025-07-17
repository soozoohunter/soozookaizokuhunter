import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  padding: 2rem 0;
`;
const Container = styled.div`
  background-color: rgba(20, 20, 20, 0.8);
  width: 95%;
  max-width: 800px;
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
  padding: 1rem 1.5rem;
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
  margin-top: 2rem;
`;
const NavButton = styled.button`
  background-color: #f97316;
  color: #fff;
  padding: 0.75rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  &:hover:not(:disabled) {
    background-color: #ea580c;
  }
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
    opacity: 0.7;
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
  vertical-align: middle;
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
  width: ${props => props.progress || 0}%;
  height: 100%;
  background: linear-gradient(90deg, #f97316, #ffce00);
  background-size: 200% 100%;
  animation: ${progressAnim} 1s linear infinite;
`;
const ResultsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
`;
const SourceCard = styled.div`
    background-color: #2a2a2a;
    border-radius: 6px;
    padding: 1rem;
    border-left: 4px solid ${props => props.color || '#f97316'};
`;
const SourceTitle = styled.h4`
    margin-top: 0;
    color: ${props => props.color || '#f97316'};
`;
const LinkList = styled.ul`
    list-style: none;
    padding: 0;
    max-height: 300px;
    overflow-y: auto;
`;
const LinkItem = styled.li`
    background: #333;
    padding: 0.5rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.9rem;
`;
const Checkbox = styled.input.attrs({ type: 'checkbox' })`
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
`;
const LinkAnchor = styled.a`
    color: #90caf9;
    word-break: break-all;
    flex-grow: 1;
    text-decoration: none;
    &:hover {
        text-decoration: underline;
    }
`;

const STATUS_MESSAGES = {
    pending: '任務排隊中，請稍候...',
    processing: 'AI 掃描進行中，這可能需要幾分鐘...',
    completed: '掃描完成！請檢視以下結果。',
    failed: '掃描失敗。'
};

const SOURCE_CONFIG = {
    vision: { title: "Google Vision", color: "#4285F4" },
    tineye: { title: "TinEye", color: "#1E90FF" },
    bing: { title: "Bing Search", color: "#008373" },
    youtube: { title: "Youtube", color: "#FF0000" },
    globalImage: { title: "Global Image Search", color: "#F4B400" },
    tiktok: { title: "TikTok Search", color: "#000000" },
    instagram: { title: "Instagram Search", color: "#E4405F" },
    facebook: { title: "Facebook Search", color: "#1877F2" }
};

export default function ProtectStep3() {
    const navigate = useNavigate();
    const location = useLocation();

    if (!location.state) {
        return (
            <PageWrapper>
                <Container>
                    <Title>錯誤</Title>
                    <p>缺少必要的狀態數據，請返回上一步。</p>
                    <ButtonRow>
                        <NavButton onClick={() => navigate('/protect/step1')}>
                            返回第一步
                        </NavButton>
                    </ButtonRow>
                </Container>
            </PageWrapper>
        );
    }

    const { scanId, step1Data } = location.state || {};
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [scanData, setScanData] = useState(null);
    const [taskStatus, setTaskStatus] = useState('pending');
    const [progress, setProgress] = useState(0);
    const [confirmedLinks, setConfirmedLinks] = useState([]);

    useEffect(() => {
        if (!scanId) {
            setError('任務 ID 遺失，無法查詢掃描狀態。請返回重試。');
            setLoading(false);
            return;
        }

        const poll = async () => {
            try {
                const res = await apiClient.get(`/api/scans/status/${scanId}`);
               const data = res.data;

                setTaskStatus(data.status);
                if (typeof data.progress === 'number') {
                    setProgress(data.progress);
                }

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
                console.error("Polling error:", err);
                if (err.response && err.response.status === 404) {
                    clearInterval(timer);
                    setLoading(false);
                    setError('找不到指定的掃描任務，請確認任務 ID 是否正確。');
                }
            }
        };

        const timer = setInterval(poll, 5000);
        poll();

        return () => clearInterval(timer);
    }, [scanId]);
    
    const allLinks = useMemo(() => {
        if (!scanData?.results) return [];
        const links = [];
        for (const [source, sourceLinks] of Object.entries(scanData.results)) {
            if (Array.isArray(sourceLinks) && sourceLinks.length > 0) {
                 sourceLinks.forEach(link => links.push({ source, url: link }));
            }
        }
        const uniqueLinks = Array.from(new Map(links.map(item => [item.url, item])).values());
        return uniqueLinks;
    }, [scanData]);


    const toggleLinkConfirmation = useCallback((url) => {
        setConfirmedLinks(prev =>
            prev.includes(url) ? prev.filter(l => l !== url) : [...prev, url]
        );
    }, []);

    const handleSelectAll = (source) => {
        const sourceLinks = (scanData?.results?.[source] || []).filter(Boolean);
        const newConfirmed = [...new Set([...confirmedLinks, ...sourceLinks])];
        setConfirmedLinks(newConfirmed);
    };


    const renderContent = () => {
        if (loading) {
            return (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                    <Spinner />
                    <p>{STATUS_MESSAGES[taskStatus]} ({progress}%)</p>
                    <ProgressBar><ProgressIndicator progress={progress} /></ProgressBar>
                </div>
            );
        }
        if (error) {
            return <ErrorMsg><strong>錯誤：</strong>{error}</ErrorMsg>;
        }
        if (taskStatus === 'completed' && (!scanData || allLinks.length === 0)) {
            return <p style={{textAlign: 'center', padding: '2rem'}}>恭喜！AI 未在公開網路上找到任何潛在的侵權連結。</p>;
        }
        
        return (
            <InfoBlock>
                <h4>AI 尋獲的潛在連結 (請勾選確認為侵權的項目)</h4>
                <ResultsGrid>
                    {Object.entries(scanData.results || {}).map(([source, links]) => {
                        if (!links || links.length === 0) return null;
                        const config = SOURCE_CONFIG[source] || { title: source, color: '#9CA3AF' };
                        
                        // [★★ 關鍵修正 ★★] 如果來源是 'vision'，則不顯示標題
                        const showTitle = source !== 'vision';

                        return(
                            <SourceCard key={source} color={config.color}>
                                {showTitle && <SourceTitle color={config.color}>{config.title} ({links.length})</SourceTitle>}
                                <button onClick={() => handleSelectAll(source)}>全選此來源</button>
                                <LinkList>
                                    {links.map((url, idx) => (
                                        <LinkItem key={`${source}-${idx}`}>
                                            <Checkbox 
                                                checked={confirmedLinks.includes(url)}
                                                onChange={() => toggleLinkConfirmation(url)}
                                            />
                                            <LinkAnchor href={url} target="_blank" rel="noopener noreferrer">{url}</LinkAnchor>
                                        </LinkItem>
                                    ))}
                                </LinkList>
                            </SourceCard>
                        )
                    })}
                </ResultsGrid>
            </InfoBlock>
        );
    };

    return (
        <PageWrapper>
            <Container>
                <Title>Step 3: 侵權掃描儀表板</Title>
                <p style={{textAlign: 'center', color: '#ccc', marginBottom: '1.5rem'}}>
                    {STATUS_MESSAGES[taskStatus]}
                </p>
                {renderContent()}
                <ButtonRow>
                    <NavButton onClick={() => navigate('/protect/step2', { state: { step1Data } })}>← 返回上一步</NavButton>
                    <NavButton
                        onClick={() => navigate('/protect/step4', { state: { fileInfo: step1Data?.file, userInfo: step1Data?.user, confirmedLinks } })}
                        disabled={loading || confirmedLinks.length === 0}
                    >
                        下一步 (已確認 {confirmedLinks.length} 項) →
                    </NavButton>
                </ButtonRow>
            </Container>
        </PageWrapper>
    );
}
