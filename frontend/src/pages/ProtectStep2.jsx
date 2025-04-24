// frontend/src/pages/ProtectStep2.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  color: #fff;
  background-color: #111;
  min-height: 100vh;
`;

const Title = styled.h2`
  color: #FFD700;
  margin-bottom: 1rem;
`;

const InfoBlock = styled.div`
  background-color: #1e1e1e;
  border: 2px solid #ff6f00;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  word-break: break-all;
`;

export default function ProtectStep2() {
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('protectStep1');
    if (!stored) {
      // 若沒有 step1 資料 => 直接跳回 step1
      navigate('/protect/step1');
    } else {
      setResult(JSON.parse(stored));
    }
  }, [navigate]);

  if (!result) {
    return null; // 或顯示 Loading...
  }

  const {
    fileId,
    pdfUrl,
    fingerprint,
    ipfsHash,
    txHash
  } = result;

  return (
    <Container>
      <Title>Step 2: Result &amp; Certificate</Title>

      <InfoBlock>
        <p><strong>File ID:</strong> {fileId}</p>
        <p><strong>Fingerprint (SHA-256):</strong> {fingerprint || 'N/A'}</p>
        <p><strong>IPFS Hash:</strong> {ipfsHash || 'N/A'}</p>
        <p><strong>Tx Hash:</strong> {txHash || 'N/A'}</p>
      </InfoBlock>

      {pdfUrl ? (
        <InfoBlock style={{ backgroundColor: '#2c2c2c' }}>
          <p><strong>Certificate PDF:</strong></p>
          <p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#4caf50', textDecoration: 'underline' }}
            >
              點我下載 / Download PDF
            </a>
          </p>
        </InfoBlock>
      ) : (
        <InfoBlock>
          <p>尚未生成 PDF 連結，或連結錯誤。</p>
        </InfoBlock>
      )}

      <p style={{ marginTop: '2rem' }}>
        <button
          onClick={() => navigate('/protect/step3')}
          style={{
            backgroundColor: '#f97316',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Next → Step 3
        </button>
      </p>
    </Container>
  );
}
