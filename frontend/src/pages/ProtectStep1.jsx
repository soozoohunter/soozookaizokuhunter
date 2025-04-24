// frontend/src/pages/ProtectStep1.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// ---------- Styled Components -----------
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
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 420px;
  border: 2px solid #ff6f00; /* 橘色外框 */
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #FFD700; /* 金色文字 */
`;

const Description = styled.p`
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  color: #cccccc;
`;

const ErrorMsg = styled.p`
  color: red;
  text-align: center;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const StyledLabel = styled.label`
  margin: 0.5rem 0 0.25rem;
  font-size: 0.9rem;
  color: #ffa500; /* 橘字 */
`;

const StyledInput = styled.input`
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #ffffff;
  background-color: #2c2c2c;
  border: 1px solid #444;
  border-radius: 4px;
`;

const SubmitButton = styled.button`
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: bold;
  color: #ffffff;
  background-color: #f97316; /* 橘色按鈕 */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  &:hover {
    background-color: #ea580c;
  }
`;

export default function ProtectStep1() {
  const navigate = useNavigate();

  // 檔案、表單欄位
  const [file, setFile] = useState(null);
  const [realName, setRealName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 檔案上傳事件
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 按下 Next => 將資料 POST 給 /api/protect/step1
  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    // 簡易檢查
    if (!file) {
      return setError('請上傳檔案 (Please upload a file).');
    }
    if (!realName.trim() || !birthDate.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      return setError('必填欄位不可空白。');
    }

    try {
      setLoading(true);
      // 組 formData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('realName', realName);
      formData.append('birthDate', birthDate);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('email', email);

      const resp = await fetch('/api/protect/step1', {
        method: 'POST',
        body: formData
      });
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || `上傳失敗: HTTP ${resp.status}`);
      }
      const data = await resp.json(); 
      console.log('step1 success =>', data);

      // 將後端回傳資訊 (pdfUrl, fileId, fingerprint等) 暫存，讓 Step2 顯示
      localStorage.setItem('protectStep1', JSON.stringify(data));

      // 前往 Step2
      navigate('/protect/step2');
    } catch (err) {
      console.error(err);
      setError(err.message || '連線失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Step 1: Upload &amp; Info</Title>

        <Description>
          為了產出您的 <strong>原創著作證明書</strong>，請上傳作品檔案並填寫下列資訊。
          檔案將自動產生 Fingerprint (SHA-256) 並上傳 IPFS，寫入區塊鏈。
          <br />
          <span style={{ color: 'red' }}>
            {error && `連線失敗，請稍後再試`}
          </span>
        </Description>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <StyledForm onSubmit={handleNext}>
          <StyledLabel>上傳作品檔案:</StyledLabel>
          <StyledInput
            type="file"
            accept="image/*,video/*,application/pdf"
            onChange={handleFileChange}
          />

          <StyledLabel>真實姓名 (Real Name):</StyledLabel>
          <StyledInput
            type="text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="e.g. 王大明 / John Wang"
          />

          <StyledLabel>生日 (Birth Date):</StyledLabel>
          <StyledInput
            type="text"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            placeholder="e.g. 1988年10月24日"
          />

          <StyledLabel>手機/電話 (Phone):</StyledLabel>
          <StyledInput
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 09xx-xxx-xxx"
          />

          <StyledLabel>地址 (Address):</StyledLabel>
          <StyledInput
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 台北市大安區泰順街40號"
          />

          <StyledLabel>Email:</StyledLabel>
          <StyledInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. yourmail@example.com"
          />

          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Next'}
          </SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
