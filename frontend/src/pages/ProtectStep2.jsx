import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../apiClient';
import styled from 'styled-components';

// --- Styled Components (與您之前版本相同，無需修改) ---
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
  strong { color: #4b5563; min-width: 180px; flex-shrink: 0; }
  span { color: #1f2937; font-family: 'Courier New', Courier, monospace; word-break: break-all; }
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
  &:hover { background-color: ${({ theme, disabled }) => !disabled && theme.colors.light.primaryHover}; }
`;
const DownloadButton = styled.a`
  display: inline-block; padding: 0.8rem 1.5rem; font-size: 1rem; font-weight: 600;
  color: ${({ theme }) => theme.colors.light.primary}; background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.light.primary};
  border-radius: 8px; text-decoration: none; transition: all 0.2s ease;
  &:hover { background-color: ${({ theme }) => theme.colors.light.secondary}; }
`;
const ErrorMessage = styled.p`
  text-align: center; color: #ef4444; margin-top: 1rem; font-weight: 500;
`;
// --- End of Styled Components ---

export default function ProtectStep2() {
    const navigate = useNavigate();
    const location = useLocation();
    const { file } = location.state?.step1Data || {};

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!file) {
            alert('找不到上一步的資料，將返回第一步。');
            navigate('/protect/step1');
        }
    }, [file, navigate]);

    // ★★★ 關鍵修改：更新 handleScan 邏輯 ★★★
    const handleScan = async () => {
        if (!file?.id) {
            setError('檔案 ID 遺失，無法啟動掃描。');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // 1. 呼叫新的 "dispatch-scan" API 來派發任務
            const response = await apiClient.post(`/protect/${file.id}/dispatch-scan`);
            const { scanId } = response.data;

            // 2. 成功派發後，使用回傳的 scanId 導航到 Step3 進度頁面
            navigate('/protect/step3', { 
                state: { 
                    scanId: scanId, 
                    file: file // 將檔案資訊也傳遞下去
                } 
            });

        } catch (err) {
            const errorMessage = err.response?.data?.message || '派發掃描任務時發生未知的錯誤。';
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

                <ButtonRow>
                    <DownloadButton
                        href={`${apiClient.defaults.baseURL}/protect/certificates/${file.id}`}
                        download
                    >
                        下載原創著作證明書 (PDF)
                    </DownloadButton>
                    <NextButton onClick={handleScan} disabled={isLoading}>
                        {isLoading ? '派發任務中...' : '下一步：啟動 AI 全網掃描 →'}
                    </NextButton>
                </ButtonRow>
            </Container>
        </PageWrapper>
    );
}
