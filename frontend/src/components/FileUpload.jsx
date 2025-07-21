import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ★ 修正文件處理 ★
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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
      const response = await axios.post('/api/protect/generate-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        navigate(`/proof/${response.data.proofId}`);
      } else {
        setError(response.data.error || '生成證明失敗');
      }
    } catch (err) {
      setError(err.response?.data?.error || '服務器錯誤，請稍後再試');
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
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <label htmlFor="file-upload" className="upload-label">
            {file ? file.name : '選擇文件'}
          </label>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading || !file}
        >
          {isLoading ? '處理中...' : '上傳並產生證明'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
