// frontend/src/components/BulkUploader.jsx (功能完整版)
import React, { useState, useContext, useRef } from 'react';
import styled from 'styled-components';
import { AuthContext } from '../AuthContext';
import apiClient from '../utils/apiClient';

// --- Styled Components ---
const UploaderWrapper = styled.div`
  background-color: #1F2937;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #374151;
  text-align: center;
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
      ? '#34D399'
      : props.status === 'failed'
      ? '#F87171'
      : '#9CA3AF'};
`;

// --- Main Component ---
function BulkUploader({ onClose, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useContext(AuthContext); // token is retrieved if needed in future
  const fileInputRef = useRef(null); // 建立一個 ref 來指向隱藏的 input

  // 觸發隱藏的 file input
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = e => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    setFiles(selectedFiles);
    // 為每個檔案設定初始狀態
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
      // 立即更新 UI 狀態
      setUploadStatus(prev => ({ ...prev, [file.name]: { status: '上傳中...', message: '' } }));
    });

    try {
      const response = await apiClient.post('/api/protect/batch-protect', formData);
      const data = response.data;


      // 根據後端回傳的 results 更新每個檔案的最終狀態
      setUploadStatus(prev => {
        const newStatus = { ...prev };
        data.results.forEach(result => {
          newStatus[result.filename] = {
            status: result.status,
            message: result.reason || '保護成功',
          };
        });
        return newStatus;
      });
      // [新功能] 如果上傳成功，呼叫父元件傳來的回呼函式
      if (response.status === 207 && onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`上傳失敗: ${error.message}`);
      // 將所有檔案狀態設為失敗
      setUploadStatus(prev => {
        const newStatus = {};
        Object.keys(prev).forEach(filename => {
          newStatus[filename] = { status: 'failed', message: '上傳失敗' };
        });
        return newStatus;
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <UploaderWrapper>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }} // 關鍵：將原生 input 隱藏
      />
      <UploadButton onClick={handleButtonClick} disabled={isUploading}>
        選擇多個檔案進行保護
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
          <UploadButton onClick={handleUpload} disabled={isUploading} style={{ marginTop: '1.5rem' }}>
            {isUploading ? '正在處理中...' : `開始上傳 ${files.length} 個檔案`}
          </UploadButton>
        </>
      )}
    </UploaderWrapper>
  );
}

export default BulkUploader;
