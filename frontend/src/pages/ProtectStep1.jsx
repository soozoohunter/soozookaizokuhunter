// frontend/src/pages/ProtectStep1.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex; 
  align-items: center;
  justify-content: center;
  background-color: #121212;
  color: #ffffff;
`;

const FormContainer = styled.div`
  background-color: #1e1e1e;
  padding: 2rem 2.5rem;
  border-radius: 8px;
  width: 100%;
  max-width: 450px;
  border: 2px solid #ff6f00;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  color: #FFD700;
`;

const Description = styled.p`
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  color: #cccccc;
`;

const ErrorMsg = styled.p`
  color: red;
  text-align: center;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const StyledLabel = styled.label`
  margin: 0.5rem 0 0.25rem;
  font-size: 0.9rem;
  color: #ffa500;
`;

const StyledInput = styled.input`
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  background-color: #2c2c2c;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
`;

const SubmitButton = styled.button`
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: bold;
  color: #ffffff;
  background-color: #f97316;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #ea580c;
  }
`;

export default function ProtectStep1() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 選檔
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 提交 => 呼叫 /api/protect/step1
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 簡易檢查
    if (!file || !realName || !phone || !address || !email || !birthDate) {
      return setError('所有欄位皆為必填，請完整填寫並選擇檔案');
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('realName', realName.trim());
      formData.append('birthDate', birthDate.trim());
      formData.append('phone', phone.trim());
      formData.append('address', address.trim());
      formData.append('email', email.trim());

      const resp = await fetch('/api/protect/step1', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || '上傳失敗');
        setLoading(false);
        return;
      }

      // 成功 => 帶著 fileId, pdfUrl 等資料去 Step2
      navigate('/protect/step2', {
        state: {
          fileId: data.fileId,
          pdfUrl: data.pdfUrl,
          fingerprint: data.fingerprint,
          ipfsHash: data.ipfsHash,
          txHash: data.txHash,
        }
      });
    } catch (err) {
      console.error(err);
      setError('連線失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Step 1: Upload & Info</Title>
        <Description>
          為了產出您的 <strong>原創著作證明</strong>，請上傳作品檔案並填寫下列資訊。  
          檔案將自動產生 Fingerprint (SHA-256) 並上傳 IPFS、寫入區塊鏈。
        </Description>
        {error && <ErrorMsg>{error}</ErrorMsg>}

        <StyledForm onSubmit={handleSubmit}>
          <StyledLabel>上傳作品檔案:</StyledLabel>
          <StyledInput type="file" onChange={handleFileChange} />

          <StyledLabel>真實姓名 (Real Name):</StyledLabel>
          <StyledInput
            type="text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="e.g. 王大明 / John Wang"
          />

          <StyledLabel>生日 (Birth Date):</StyledLabel>
          <StyledInput
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />

          <StyledLabel>手機/電話 (Phone):</StyledLabel>
          <StyledInput
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xx-xxx-xxx"
          />

          <StyledLabel>地址 (Address):</StyledLabel>
          <StyledInput
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="台北市大安區..."
          />

          <StyledLabel>Email:</StyledLabel>
          <StyledInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <SubmitButton disabled={loading}>
            {loading ? 'Uploading...' : 'Next'}
          </SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
