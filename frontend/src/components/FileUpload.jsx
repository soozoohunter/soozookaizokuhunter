import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ★ 修正文件處理 ★
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError('文件大小不能超過100MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('請選擇要上傳的文件');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // ★ 使用正確的API端點 ★
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('用戶未登錄');
      }

      const response = await axios.post('/api/protect/generate-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        navigate(`/proof/${response.data.proofId}`);
      } else {
        setError(response.data.error || '生成證明失敗');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error ||
                      err.response?.data?.message ||
                      err.message ||
                      '服務器錯誤，請稍後再試';
      setError(errorMsg);
      console.error('文件上傳錯誤:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <form onSubmit={handleSubmit}>
        <div className="upload-area">
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <label htmlFor="file-upload" className="upload-label">
            {file ? file.name : '選擇文件'}
          </label>
        </div>
        
        {error && (
          <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading || !file}
          style={{
            backgroundColor: isLoading ? '#ccc' : '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '處理中...' : '上傳並產生證明'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
