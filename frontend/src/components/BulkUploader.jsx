// frontend/src/components/BulkUploader.jsx (功能強化與錯誤處理修正)
import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import apiClient from '../utils/apiClient';

// --- Styled Components (保持不變) ---
const UploaderWrapper = styled.div`
  background-color: #1F2937;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #374151;
  text-align: center;
  width: 90%;
  max-width: 700px;
`;

const UploadButton = styled.button`
  background-color: #2563EB;
  color: white;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #1D4ED8;
  }

  &:disabled {
    background-color: #4B5563;
    cursor: not-allowed;
  }
`;

const FileList = styled.div`
  margin-top: 1.5rem;
  max-height: 200px;
  overflow-y: auto;
  text-align: left;
  background-color: #111827;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 1rem;
`;

const FileStatus = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #374151;
  &:last-child {
    border-bottom: none;
  }
`;

const StatusText = styled.span`
  font-weight: bold;
  color: ${props =>
    props.status === 'success'
      ? '#34D399' // 綠色
      : props.status === 'failed'
      ? '#F87171' // 紅色
      : '#9CA3AF'}; // 灰色
`;

const CloseButton = styled.button`
  background-color: #4B5563;
  color: #E5E7EB;
  margin-left: 1rem;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #6B7280;
  }
`;

// --- 主元件 ---
function BulkUploader({ onClose, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = e => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    setFiles(selectedFiles);
    
    const initialStatus = {};
    selectedFiles.forEach(file => {
      initialStatus[file.name] = { status: '待上傳', message: '' };
    });
    setUploadStatus(initialStatus);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
      setUploadStatus(prev => ({ ...prev, [file.name]: { status: '上傳中...', message: '' } }));
    });

    try {
      // [核心修正] 直接使用 apiClient，它會自動處理 token 和 headers
      const response = await apiClient.post('/api/protect/batch-protect', formData);
      
      const data = response.data;
      
      // 更新每個檔案的最終狀態
      setUploadStatus(prev => {
        const newStatus = { ...prev };
        data.results.forEach(result => {
          if (newStatus[result.filename]) {
             newStatus[result.filename] = {
                status: result.status,
                message: result.reason || '保護成功',
             };
          }
        });
        return newStatus;
      });
      
    } catch (error) {
      // [核心修正] 提供更詳細的錯誤訊息
      const errorMsg = error.response?.data?.error || error.message || '未知上傳錯誤';
      alert(`上傳失敗: ${errorMsg}`);
      console.error('Upload failed:', error.response || error);

      // 將所有還在處理中的檔案狀態設為失敗
      setUploadStatus(prev => {
        const newStatus = {...prev};
        Object.keys(newStatus).forEach(filename => {
            if(newStatus[filename].status === '上傳中...') {
                newStatus[filename] = { status: 'failed', message: errorMsg };
            }
        });
        return newStatus;
      });
    } finally {
      setIsUploading(false);
      // 延遲一段時間後自動刷新 Dashboard，確保新資料載入
      setTimeout(() => {
        onUploadComplete();
      }, 1500);
    }
  };

  return (
    <UploaderWrapper>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*,video/*" // 限制檔案類型
      />
      <UploadButton onClick={handleButtonClick} disabled={isUploading}>
        選擇多個檔案進行保護 (圖片/影片)
      </UploadButton>

      {files.length > 0 && (
        <>
          <FileList>
            {files.map(file => (
              <FileStatus key={file.name}>
                <span>{file.name}</span>
                <StatusText status={uploadStatus[file.name]?.status}>
                  {uploadStatus[file.name]?.status}
                </StatusText>
              </FileStatus>
            ))}
          </FileList>
          <div style={{ marginTop: '1.5rem' }}>
            <UploadButton onClick={handleUpload} disabled={isUploading}>
              {isUploading ? '正在處理中...' : `開始保護 ${files.length} 個內容`}
            </UploadButton>
            <CloseButton onClick={onClose} disabled={isUploading}>關閉</CloseButton>
          </div>
        </>
      )}
    </UploaderWrapper>
  );
}

export default BulkUploader;
