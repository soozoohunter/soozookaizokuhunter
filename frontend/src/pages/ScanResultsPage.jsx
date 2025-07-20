import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '../apiClient';

const ResultsContainer = styled.div`
  padding: 2rem;
  background: ${({ theme }) => theme.colors.dark.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  margin: 1rem auto;
  max-width: 1200px;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.dark.accent};
  border-bottom: 1px solid ${({ theme }) => theme.colors.dark.border};
  padding-bottom: 0.5rem;
`;

const FingerprintBox = styled.div`
  background: ${({ theme }) => theme.colors.dark.background};
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-family: monospace;
  word-break: break-all;
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
`;

const ScanResultsPage = () => {
  const { scanId } = useParams();
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScanResults = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/scans/${scanId}`);

        // 确保数据中包含 fingerprint 字段
        if (!response.data.fingerprint) {
          throw new Error('文件指纹信息缺失');
        }

        setScanData(response.data);
      } catch (err) {
        setError(err.message || '获取扫描结果失败');
      } finally {
        setLoading(false);
      }
    };

    fetchScanResults();
  }, [scanId]);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <ResultsContainer>
      <Section>
        <Title>掃描結果</Title>
        <p>狀態: {scanData.status}</p>
        <p>完成時間: {new Date(scanData.completedAt).toLocaleString()}</p>
      </Section>

      <Section>
        <Title>文件指紋 (SHA-256)</Title>
        <FingerprintBox>
          {scanData.fingerprint}
        </FingerprintBox>
        <p>此唯一指紋可用於驗證文件的真實性和完整性。</p>
      </Section>

      <Section>
        <Title>侵權檢測結果</Title>
        {/* 侵权结果展示逻辑 */}
      </Section>
    </ResultsContainer>
  );
};

export default ScanResultsPage;
