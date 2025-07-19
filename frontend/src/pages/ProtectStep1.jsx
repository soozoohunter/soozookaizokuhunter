import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '../apiClient';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

// [★★ 新增 ★★]
const BackButton = styled.button`
  position: absolute;
  top: 98px; /* Header height + spacing */
  left: 2rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  color: ${({ theme }) => theme.colors.light.textMuted};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.light.primary};
    color: ${({ theme }) => theme.colors.light.text};
  }
`;

const FormContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.dark.card};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 2.5rem;
  width: 100%;
  max-width: 600px;
  box-shadow: ${({ theme }) => theme.shadows.dark};
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.dark.accent};
  font-size: 2rem;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.dark.textSecondary};
`;

const Input = styled.input`
  padding: 0.8rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.dark.background};
  color: ${({ theme }) => theme.colors.dark.text};
  font-size: 1rem;
`;

const SubmitButton = styled.button`
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  background-color: ${({ theme }) => theme.colors.dark.primary};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.dark.primaryHover};
  }
`;

const ErrorMsg = styled.p`
  color: #F87171;
  text-align: center;
`;

const ProtectStep1 = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [keywords, setKeywords] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await apiClient.post('/protect/step1', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      navigate('/protect/step2', { state: { step1Data: response.data } });
    } catch (err) {
      setError(err.message || '上傳失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      {/* [★★ 新增 ★★] */}
      <BackButton onClick={() => navigate(-1)}>← 返回上一頁</BackButton>
      <FormContainer>
        <Title>Step 1: 上傳您的原創作品</Title>
        <StyledForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="file-upload">選擇檔案 (圖片或影片)</Label>
            <Input id="file-upload" type="file" onChange={(e) => setFile(e.target.files[0])} />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="keywords">相關關鍵字 (選填)</Label>
            <Input
              id="keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="例如：作品名稱、主題，以逗號分隔"
            />
          </FormGroup>
          
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? '處理中...' : '上傳並產生證明'}
          </SubmitButton>

          {error && <ErrorMsg>{error}</ErrorMsg>}
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
};

export default ProtectStep1;
