import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../apiClient';
import styled from 'styled-components';

const PageWrapper = styled.div`
  min-height: 100vh; padding: 4rem 2rem;
  background-color: ${({ theme }) => theme.colors.light.card};
  display: flex; align-items: center; justify-content: center;
`;
const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.light.background};
  width: 100%; max-width: 700px; padding: 2.5rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  box-shadow: ${({ theme }) => theme.shadows.main};
  transition: all 0.3s ease-in-out;
`;
const Title = styled.h2`
  text-align: center; margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.light.text}; font-size: 2rem;
`;
const InfoBlock = styled.div`
  background-color: #f9fafb; padding: 1.5rem;
  border-radius: 8px; margin-bottom: 2rem;
  border: 1px solid #f3f4f6;
`;
const InfoRow = styled.p`
  margin: 0.8rem 0; display: flex; flex-wrap: wrap; align-items: baseline;
  strong {
    color: #4b5563; min-width: 180px; flex-shrink: 0;
  }
  span {
    color: #1f2937; font-family: 'Courier New', Courier, monospace;
    word-break: break-all;
  }
`;
const ButtonRow = styled.div`
  text-align: center; margin-top: 2rem;
`;
const NextButton = styled.button`
  background: ${({ theme, disabled }) => disabled ? '#9ca3af' : theme.colors.light.primary};
  color: white; border: none;
  padding: 0.8rem 1.5rem; font-size: 1rem; font-weight: bold;
  border-radius: 8px; cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  margin-left: 1rem;
  transition: background-color 0.2s;
  &:hover { 
    background-color: ${({ theme, disabled }) => !disabled && theme.colors.light.primaryHover}; 
  }
`;
const DownloadButton = styled.a`
  display: inline-block; padding: 0.8rem 1.5rem; font-size: 1rem; font-weight: 600;
  color: ${({ theme }) => theme.colors.light.primary}; background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.light.primary};
  border-radius: 8px; text-decoration: none; transition: all 0.2s ease;
  &:hover { background-color: ${({ theme }) => theme.colors.light.secondary}; }
`;
const ErrorMessage = styled.p`
  text-align: center;
  color: #ef4444;
  margin-top: 1rem;
  font-weight: 500;
`;

// --- 新增的掃描結果元件 ---
const ResultsBlock = styled.div`
  margin-top: 2rem;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 1.5rem;
  border-radius: 8px;
`;
const ResultsTitle = styled.h3`
  color: #166534;
  margin-top: 0;
  margin-bottom: 1rem;
  text-align: center;
`;
const LinkList = styled.ul`
  list-style-type: none;
  padding-left: 0;
`;
const LinkItem = styled.li`
  background-color: #fff;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  word-break: break-all;
  a {
    color: ${({ theme }) => theme.colors.light.primary};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;
const NoResultsText = styled.p`
    text-align: center;
    color: #374151;
    font-size: 1.1rem;
`;

export default function ProtectStep2() {
    const navigate = useNavigate();
    const location = useLocation();
    const { file } = location.state?.step1Data || {};

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [scanResults, setScanResults] = useState(null); // ★ 新增狀態來保存掃描結果

    useEffect(() => {
        if (!file) {
            alert('找不到上一步的資料，將返回第一步。');
            navigate('/protect/step1');
        }
    }, [file, navigate]);

    const handleScan = async () => {
        if (!file?.id) {
            setError('檔案 ID 遺失，無法啟動掃描。');
            return;
        }
        setIsLoading(true);
        setError('');
        setScanResults(null);
        try {
            const response = await apiClient.post(`/protect/scan/${file.id}`);
            // ★ 不再導航，而是將結果設置到 state 中 ★
            setScanResults(response.data.suspiciousLinks || []);
        } catch (err) {
            const errorMessage = err.response?.data?.message || '啟動掃描時發生未知的錯誤。';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!file) return null;

    return (
        <PageWrapper>
            <Container>
                <Title>Step 2: 原創著作證明</Title>
                <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '1.5rem' }}>
                    您的檔案已成功上傳存證。您可下載證明書，或立即啟動 AI 全網掃描。
                </p>
                <InfoBlock>
                    <InfoRow><strong>檔案名稱:</strong> <span>{file.filename}</span></InfoRow>
                    <InfoRow><strong>數位指紋 (SHA-256):</strong> <span>{file.fingerprint}</span></InfoRow>
                    <InfoRow><strong>IPFS 存證 Hash:</strong> <span>{file.ipfsHash || 'N/A'}</span></InfoRow>
                    <InfoRow><strong>區塊鏈交易 Hash:</strong> <span>{file.txHash || 'N/A'}</span></InfoRow>
                </InfoBlock>
                
                {error && <ErrorMessage>{error}</ErrorMessage>}

                {/* --- 根據是否有掃描結果，條件性渲染 UI --- */}
                {scanResults === null ? (
                    <ButtonRow>
                        <DownloadButton
                            href={`${apiClient.defaults.baseURL}/protect/certificates/${file.id}`}
                            download
                        >
                            下載原創著作證明書 (PDF)
                        </DownloadButton>
                        <NextButton onClick={handleScan} disabled={isLoading}>
                            {isLoading ? '掃描中...' : '啟動 AI 全網掃描 →'}
                        </NextButton>
                    </ButtonRow>
                ) : (
                    <ResultsBlock>
                        <ResultsTitle>AI 全網掃描結果</ResultsTitle>
                        {scanResults.length > 0 ? (
                            <>
                                <NoResultsText>已發現以下 {scanResults.length} 個疑似侵權連結：</NoResultsText>
                                <LinkList>
                                    {scanResults.map((link, index) => (
                                        <LinkItem key={index}>
                                            <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                                        </LinkItem>
                                    ))}
                                </LinkList>
                            </>
                        ) : (
                            <NoResultsText>恭喜！未在網路上發現疑似侵權的內容。</NoResultsText>
                        )}
                        <ButtonRow>
                            <NextButton onClick={() => setScanResults(null)} disabled={isLoading}>
                                {isLoading ? '掃描中...' : '重新掃描'}
                            </NextButton>
                        </ButtonRow>
                    </ResultsBlock>
                )}
            </Container>
        </PageWrapper>
    );
}
