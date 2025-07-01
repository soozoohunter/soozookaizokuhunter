// frontend/src/pages/ProtectStep3.jsx (Final Bulletproof Version)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// --- 樣式定義 (請保持或使用你現有的) ---
const spin = keyframes` to { transform: rotate(360deg); } `;
const PageWrapper = styled.div`/* ... */`;
const Container = styled.div`/* ... */`;
const Title = styled.h2`/* ... */`;
const InfoBlock = styled.div`/* ... */`;
const ErrorMsg = styled.div`/* ... */`;
const ButtonRow = styled.div`/* ... */`;
const NavButton = styled.button`/* ... */`;
const Spinner = styled.div`/* ... */`;


// --- Helper Function to safely extract links ---
const extractLinks = (result) => {
    if (!result || !result.scan || !result.scan.reverseImageSearch) {
        return [];
    }
    const { googleVision, tineye, bing } = result.scan.reverseImageSearch;
    const links = [];
    if (googleVision?.success && Array.isArray(googleVision.links)) {
        googleVision.links.forEach(url => links.push({ source: 'Google', url }));
    }
    if (tineye?.success && Array.isArray(tineye.matches)) {
        tineye.matches.forEach(match => links.push({ source: 'TinEye', url: match.url }));
    }
    if (bing?.success && Array.isArray(bing.links)) {
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

    const { taskId } = location.state || {};
    const [step1Data, setStep1Data] = useState(location.state?.step1Data || null);

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
                        setError(errData?.error || '掃描任務執行失敗');
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
            return <> <Spinner /> <p>掃描進行中，請稍候...</p> </>
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
