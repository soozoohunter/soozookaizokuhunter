import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import apiClient from '../apiClient';

// [★★ 關鍵優化 ★★] - Wrapper to make page content look good in the new layout
const PageWrapper = styled.div`
  padding-top: 74px; /* Spacer for fixed header */
  display: flex;
  justify-content: center;
  padding: 4rem 2rem;
`;

const FormContainer = styled.div`
  background-color: #F8F8F8;
  border: 1px solid #EAEAEA;
  border-radius: 12px;
  padding: 2rem 2.5rem;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #0A0101;
`;

const ProtectStep1 = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [keywords, setKeywords] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('請選擇要保護的檔案。');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('keywords', keywords);

    try {
      // Assuming your apiClient is set up to handle FormData
      const response = await apiClient.post('/protect/step1', formData);
      
      // Navigate to step 2 with the response data
      navigate('/protect/step2', { state: { scanId: response.scanId, file: response.file } });
    } catch (err) {
      setError(err.message || '上傳失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Step 1: 上傳您的原創作品</Title>
        <form onSubmit={handleSubmit}>
          {/* Your form inputs for file and keywords go here */}
          <div>
            <label>選擇檔案</label>
            <input type="file" onChange={handleFileChange} />
          </div>
          <div>
            <label>相關關鍵字（可選）</label>
            <input 
              type="text" 
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="例如：作品名稱、主題"
            />
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? '處理中...' : '上傳並保護'}
          </button>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      </FormContainer>
    </PageWrapper>
  );
};

export default ProtectStep1;
