// frontend/src/components/FileCard.jsx (新功能元件)
import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background-color: #1F2937;
  border: 1px solid #374151;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.25);
  }
`;

const Thumbnail = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  background-color: #374151;
`;

const CardContent = styled.div`
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const FileName = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #F3F4F6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const InfoText = styled.p`
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: #9CA3AF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  span {
    font-weight: 600;
    color: #D1D5DB;
  }
`;

const Actions = styled.div`
  margin-top: auto;
  padding-top: 1rem;
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  flex-grow: 1;
  padding: 0.6rem;
  font-size: 0.9rem;
  font-weight: bold;
  border: 1px solid #4B5563;
  background-color: #374151;
  color: #E5E7EB;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #4B5563;
  }
`;

const ScanButton = styled(ActionButton)`
  background-color: #1D4ED8;
  border-color: #2563EB;
  &:hover {
    background-color: #1E40AF;
  }
`;

export default function FileCard({ file, onScan }) {
  // 判斷最新的掃描狀態
  const latestScan = file.scans && file.scans.length > 0 ? file.scans[0] : null;
  const scanStatus = latestScan ? latestScan.status : 'Not Scanned';

  return (
    <Card>
      <Thumbnail src={file.thumbnailUrl} alt={file.fileName} />
      <CardContent>
        <FileName title={file.fileName}>{file.fileName}</FileName>
        <InfoText><span>SHA256:</span> {file.fingerprint}</InfoText>
        <InfoText><span>IPFS:</span> {file.ipfsHash}</InfoText>
        <InfoText><span>狀態:</span> {scanStatus}</InfoText>
        <Actions>
          <ScanButton onClick={() => onScan(file.fileId)}>
            {scanStatus === 'pending' || scanStatus === 'processing' ? '偵測中...' : '發動侵權偵測'}
          </ScanButton>
          <ActionButton onClick={() => alert('Navigate to details page!')}>
            詳情與申訴
          </ActionButton>
        </Actions>
      </CardContent>
    </Card>
  );
}
