// frontend/src/pages/FileDetailPage.jsx (最終顯示增強版)
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import styled from 'styled-components';

const PageContainer = styled.div``;
const BackLink = styled(Link)``;
const Section = styled.div``;
const Table = styled.table``;

function FileDetailPage() {
    const { fileId } = useParams();
    const [fileData, setFileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await apiClient.get(`/api/files/${fileId}`);
                setFileData(response.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load file details.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [fileId]);

    if (isLoading) return <PageContainer>Loading details...</PageContainer>;
    if (error) return <PageContainer style={{ color: 'red' }}>Error: {error}</PageContainer>;
    if (!fileData) return <PageContainer>File not found.</PageContainer>;

    return (
        <PageContainer>
            <BackLink to="/dashboard">&larr; 返回儀表板</BackLink>
            <h2>檔案詳情: {fileData.filename}</h2>
            
            <Section>
                <img src={fileData.thumbnailUrl} alt="Thumbnail" style={{ maxWidth: '300px', borderRadius: '8px', border: '1px solid #374151' }} />
                <h3>存證資訊</h3>
                <p><strong>SHA256:</strong> {fileData.fingerprint}</p>
                <p><strong>IPFS Hash:</strong> {fileData.ipfs_hash}</p>
                <p><strong>區塊鏈交易 Hash:</strong> {fileData.tx_hash}</p>
            </Section>

            <Section>
                <h3>掃描歷史紀錄</h3>
                <Table>
                    <thead>
                        <tr>
                            <th>掃描 ID</th>
                            <th>狀態</th>
                            <th>掃描時間</th>
                            <th>結果</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fileData.scans && fileData.scans.map(scan => (
                            <tr key={scan.id}>
                                <td>{scan.id}</td>
                                <td>{scan.status}</td>
                                <td>{new Date(scan.createdAt).toLocaleString()}</td>
                                <td>
                                    {scan.status === 'completed' && (
                                        <>
                                            <p>發現 {scan.result?.scan?.totalMatches || 0} 個侵權連結</p>
                                            {scan.result?.errors?.length > 0 && (
                                                <div style={{color: '#FBBF24'}}>
                                                    <p>API 錯誤:</p>
                                                    <ul>{scan.result.errors.map(e => <li key={e.source}>{e.source}: {e.reason}</li>)}</ul>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {scan.status === 'failed' && <p style={{color: '#F87171'}}>掃描失敗</p>}
                                </td>
                                <td>
                                    {scan.status === 'completed' && <button>查看報告 & 申訴</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Section>
        </PageContainer>
    );
}

export default FileDetailPage;
