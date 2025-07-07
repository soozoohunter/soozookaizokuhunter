// frontend/src/components/FileCard.jsx (最終版)
import React from 'react';
import { Link } from 'react-router-dom';
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

const Thumbnail = styled.div`
  width: 100%;
  padding-top: 75%;
  background-color: #374151;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  border-bottom: 1px solid #374151;
`;

const CardContent = styled.div`
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const FileName = styled.h4`
  margin: 0 0 0.75rem 0;
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
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #374151;
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
  color: #FFFFFF;
  &:hover {
    background-color: #1E40AF;
  }
  &:disabled {
    background-color: #2b3441;
    color: #6B7280;
    cursor: not-allowed;
  }
`;

export default function FileCard({ file, onScan }) {
  const latestScan = file.scans && file.scans.length > 0 ? file.scans[0] : null;
  const scanStatus = latestScan?.status || 'Not Scanned';
  const infringementCount = latestScan?.result?.scan?.totalMatches || 0;

  const handleScanClick = () => {
    if (scanStatus === 'pending' || scanStatus === 'processing') return;
    onScan(file.fileId);
  };

  return (
    <Card>
      {/* [修正] 使用 div 的 background-image 來顯示縮圖，容錯性更好 */}
      <Thumbnail src={file.thumbnailUrl} />
      <CardContent>
        <FileName title={file.fileName}>{file.fileName}</FileName>
        <InfoText title={file.fingerprint}><span>SHA256:</span> {file.fingerprint}</InfoText>
        <InfoText title={file.ipfsHash}><span>IPFS:</span> {file.ipfsHash}</InfoText>
        <InfoText>
          <span>狀態:</span> 
          {scanStatus === 'completed' ? ` 掃描完成 - 發現 ${infringementCount} 個潛在侵權` : scanStatus}
        </InfoText>
        <Actions>
          <ScanButton onClick={handleScanClick} disabled={scanStatus === 'pending' || scanStatus === 'processing'}>
            {scanStatus === 'pending' || scanStatus === 'processing' ? '偵測中...' : '發動侵權偵測'}
          </ScanButton>
          <ActionButton as={Link} to={`/file/${file.fileId}`} style={{textDecoration: 'none', textAlign: 'center', lineHeight: '1.5'}}>
            詳情與申訴
          </ActionButton>
        </Actions>
      </CardContent>
    </Card>
  );
}
