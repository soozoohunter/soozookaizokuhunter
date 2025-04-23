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
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
  width: 100%;
  max-width: 420px;
  border: 2px solid #ff6f00;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  color: #FFD700;
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
  background-color: #f97316;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  &:hover {
    background-color: #ea580c;
  }
`;

const Description = styled.p`
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 1rem 0;
  color: #cccccc;
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

  // 1) File picker moved to top
  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleNext = e => {
    e.preventDefault();
    if (!file) {
      setError('請上傳檔案');
      return;
    }
    if (!realName || !phone || !address || !email) {
      setError('真實姓名 / 電話 / 地址 / Email 為必填');
      return;
    }
    setError('');
    // TODO: call your /api/protect/step1 here if needed
    navigate('/protect/step2');
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Step 1: Upload & Info</Title>

        {/* ↑ file first */}
        <StyledLabel>上傳作品檔案 (Upload your work):</StyledLabel>
        <StyledInput type="file" onChange={handleFileChange} />

        <Description>
          【繁中】為了產出您的<strong>原創著作證明書</strong>、確立
          <strong>著作權保護</strong>並能在必要時採取法律行動，我們必須請您填寫真實姓名、
          聯絡方式與Email。<br/><br/>
          <strong>【EN】</strong> To generate your <em>Originality Certificate</em> and establish
          genuine copyright protection—
          we need your real name, contact info, and email.
        </Description>

        <StyledForm onSubmit={handleNext}>
          <StyledLabel>真實姓名 (Real Name):</StyledLabel>
          <StyledInput
            value={realName}
            onChange={e => setRealName(e.target.value)}
            placeholder="e.g. 王大明 / John Wang"
          />

          <StyledLabel>電話 (Phone):</StyledLabel>
          <StyledInput
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 09xx-xxx-xxx"
          />

          <StyledLabel>地址 (Address):</StyledLabel>
          <StyledInput
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. 台北市大安區"
          />

          <StyledLabel>Email:</StyledLabel>
          <StyledInput
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="e.g. yourmail@example.com"
          />

          {error && <ErrorMsg>{error}</ErrorMsg>}
          <SubmitButton type="submit">Next</SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
