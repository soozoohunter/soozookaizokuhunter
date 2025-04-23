// frontend/src/pages/ProtectStep1.jsx
import React, { useState, useEffect } from 'react';
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
  max-width: 450px;
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

const PreviewBox = styled.div`
  margin: 1rem 0;
  text-align: center;
  border: 1px dashed #aaa;
  padding: 1rem;
  border-radius: 6px;
`;

const PreviewImg = styled.img`
  max-width: 100%;
  height: auto;
  margin-top: 0.5rem;
`;

const FileName = styled.p`
  font-size: 0.9rem;
  color: #ccc;
  margin-top: 0.5rem;
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
  const [previewBase64, setPreviewBase64] = useState(null);
  const [fileName, setFileName] = useState('');
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // 載入 localStorage 裡的檔案 (base64 + 檔名)
  useEffect(() => {
    const b64 = localStorage.getItem('uploadedFileBase64');
    const fName = localStorage.getItem('uploadedFileName');
    if (b64) setPreviewBase64(b64);
    if (fName) setFileName(fName);
  }, []);

  const handleNext = async (e) => {
    e.preventDefault();

    // 檢查必填
    if (!previewBase64) {
      setError('No file was selected. Please go back and upload first.');
      return;
    }
    if (!realName.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      setError('Real Name / Phone / Address / Email are required');
      return;
    }
    setError('');

    try {
      // 將 base64 轉檔為 blob
      const formData = new FormData();
      const byteString = atob(previewBase64.split(',')[1]);
      const mimeString = previewBase64.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      formData.append('file', blob, fileName);
      formData.append('realName', realName);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('email', email);

      const res = await fetch('/api/protect/step1', {
        method: 'POST',
        body: formData
      });
      // 若失敗 => 顯示後端訊息
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Server error');
      }
      // 成功 => 進到下一步
      navigate('/protect/step2');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server error, please try again later.');
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Step 1: Upload & Info</Title>

        <PreviewBox>
          <strong>Uploaded File Preview:</strong>
          {previewBase64 ? (
            mimeTypeIsImage(fileName) ? (
              <>
                <PreviewImg src={previewBase64} alt="preview" />
                <FileName>{fileName}</FileName>
              </>
            ) : (
              <FileName>[Non-Image File] {fileName}</FileName>
            )
          ) : (
            <p style={{ color:'#aaa' }}>No file found. Please go back to Home and upload.</p>
          )}
        </PreviewBox>

        <Description>
          【繁中】您已於首頁上傳作品檔案，我們將為您產出
          <strong> 原創著作證明</strong>、確立<strong> 著作權保護</strong>，並能在必要時採取法律行動。
          <br/><br/>
          <strong>EN</strong> Please fill in your real info below so we can generate
          your <em>Originality Certificate</em> and ensure legitimate copyright protection.
        </Description>

        <StyledForm onSubmit={handleNext}>
          <StyledLabel>真實姓名 (Real Name):</StyledLabel>
          <StyledInput
            type="text"
            value={realName}
            onChange={e => setRealName(e.target.value)}
            placeholder="e.g. 王大明 / John Wang"
          />

          <StyledLabel>電話 (Phone):</StyledLabel>
          <StyledInput
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 09xx-xxx-xxx"
          />

          <StyledLabel>地址 (Address):</StyledLabel>
          <StyledInput
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. 台北市大安區 / Taipei City"
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

function mimeTypeIsImage(fileName='') {
  const lower = fileName.toLowerCase();
  return (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif'));
}
