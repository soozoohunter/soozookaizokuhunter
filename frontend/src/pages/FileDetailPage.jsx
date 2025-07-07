// frontend/src/pages/FileDetailPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import apiClient from '../utils/apiClient';
import styled from 'styled-components';

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

    if (isLoading) return <div>Loading details...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (!fileData) return <div>File not found.</div>;

    return (
        <div>
            <Link to="/dashboard">&larr; 返回儀表板</Link>
            <h2>檔案詳情: {fileData.fileName}</h2>

            <img src={fileData.thumbnailUrl} alt="Thumbnail" style={{ maxWidth: '300px', borderRadius: '8px' }} />

            <h3>存證資訊</h3>
            <p><strong>SHA256:</strong> {fileData.fingerprint}</p>
            <p><strong>IPFS Hash:</strong> {fileData.ipfsHash}</p>
            <p><strong>區塊鏈交易 Hash:</strong> {fileData.txHash}</p>

            <h3>掃描歷史紀錄</h3>
            <table>
                <thead>
                    <tr>
                        <th>掃描 ID</th>
                        <th>狀態</th>
                        <th>發現潛在侵權數</th>
                        <th>掃描時間</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {fileData.scans.map(scan => (
                        <tr key={scan.id}>
                            <td>{scan.id}</td>
                            <td>{scan.status}</td>
                            <td>{scan.result?.scan?.totalMatches || 0}</td>
                            <td>{new Date(scan.createdAt).toLocaleString()}</td>
                            <td><button>查看報告 & 申訴</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default FileDetailPage;
