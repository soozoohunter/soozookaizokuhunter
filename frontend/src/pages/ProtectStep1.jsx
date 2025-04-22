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

const ErrorMsg = styled.p`
  color: red;
  text-align: center;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

export default function ProtectStep1() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // 檔案上傳
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 按下 Next 按鈕時的檢查
  const handleNext = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('請上傳檔案');
      return;
    }
    if (!realName.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      setError('真實姓名 / 電話 / 地址 / Email 為必填');
      return;
    }
    setError('');

    // ★ TODO: 串接後端 API (若有需要)
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('realName', realName);
    // formData.append('phone', phone);
    // formData.append('address', address);
    // formData.append('email', email);
    // await fetch('/api/protect/step1', { method:'POST', body: formData });

    // 完成後跳至 Step 2
    navigate('/protect/step2');
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Step 1: Upload & Info</Title>

        {/* ★★★ 雙語說明 ★★★ */}
        <Description>
          【繁中】為了產出您的<strong>原創著作證明書</strong>、確立
          <strong>著作權保護</strong>，並能在必要時採取法律行動，我們必須請您填寫真實姓名、聯絡方式與Email。
          這些資料將用於確認您的身分與作品所有權，確保一旦產生證明文件，能真正證明「您」是該作品的原創人。<br/><br/>
          <strong>【EN】</strong> To generate your <em>Originality Certificate</em> and establish genuine
          copyright protection, we need your real name, contact info, and email. This information confirms
          your identity and ownership of the uploaded work, ensuring the legal authenticity of any issued certificate.
        </Description>

        <StyledForm onSubmit={handleNext}>
          {/* 上傳作品檔案 */}
          <StyledLabel>上傳作品檔案 (Upload your work):</StyledLabel>
          <StyledInput
            type="file"
            onChange={handleFileChange}
          />

          {/* 真實姓名 */}
          <StyledLabel>真實姓名 (Real Name):</StyledLabel>
          <StyledInput
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="e.g. 王大明 / John Wang"
          />

          {/* 電話 */}
          <StyledLabel>電話 (Phone):</StyledLabel>
          <StyledInput
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 09xx-xxx-xxx"
          />

          {/* 地址 */}
          <StyledLabel>地址 (Address):</StyledLabel>
          <StyledInput
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 台北市大安區 / Da’an Dist., Taipei"
          />

          {/* Email */}
          <StyledLabel>Email:</StyledLabel>
          <StyledInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. yourmail@example.com"
          />

          {error && <ErrorMsg>{error}</ErrorMsg>}

          {/* 下一步 */}
          <SubmitButton type="submit">
            Next
          </SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
