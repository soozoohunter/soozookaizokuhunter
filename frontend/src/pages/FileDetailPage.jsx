import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '../apiClient';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.dark.textSecondary};
  &:hover {
    color: ${({ theme }) => theme.colors.dark.primary};
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  word-break: break-all;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: ${({ theme }) => theme.colors.dark.card};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 1.5rem;
`;

const InfoTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: ${({ theme }) => theme.colors.dark.accent};
`;

const InfoRow = styled.p`
  margin: 0.8rem 0;
  font-size: 0.9rem;
  word-break: break-all;
  
  strong {
    color: ${({ theme }) => theme.colors.dark.textSecondary};
    display: block;
    margin-bottom: 0.25rem;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dark.border};
  text-align: left;
`;

const Td = styled.td`
  padding: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dark.border};
`;

function FileDetailPage() {
    const { fileId } = useParams();
    const [fileData, setFileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await apiClient.get(`/files/${fileId}`);
                setFileData(response.data);
            } catch (err) {
                setError(err.message || '無法載入檔案詳情。');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [fileId]);

    if (isLoading) return <PageContainer>載入中...</PageContainer>;
    if (error) return <PageContainer style={{ color: 'red' }}>錯誤: {error}</PageContainer>;
    if (!fileData) return <PageContainer>找不到檔案。</PageContainer>;

    return (
        <PageContainer>
            <BackLink to="/dashboard">&larr; 返回儀表板</BackLink>
            <Title>檔案詳情: {fileData.filename}</Title>
            
            <Grid>
                <Section>
                    <img src={fileData.thumbnailUrl || '/placeholder.png'} alt="Thumbnail" style={{ width: '100%', borderRadius: '8px', border: `1px solid #374151` }} />
                    <InfoTitle style={{marginTop: '1.5rem'}}>存證資訊</InfoTitle>
                    <InfoRow><strong>數位指紋 (SHA256):</strong> {fileData.fingerprint}</InfoRow>
                    <InfoRow><strong>IPFS Hash:</strong> {fileData.ipfs_hash || 'N/A'}</InfoRow>
                    <InfoRow><strong>區塊鏈交易 Hash:</strong> {fileData.tx_hash || 'N/A'}</InfoRow>
                </Section>

                <Section>
                    <InfoTitle>掃描歷史紀錄</InfoTitle>
                    {/* A proper table should be implemented here */}
                    <p>掃描紀錄功能待開發...</p>
                </Section>
            </Grid>
        </PageContainer>
    );
}

export default FileDetailPage;
