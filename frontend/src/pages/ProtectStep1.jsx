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

  // 從 localStorage 載入 base64 + filename
  const [previewBase64, setPreviewBase64] = useState(null);
  const [fileName, setFileName] = useState('');

  // 表單欄位
  const [realName, setRealName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');

  const [error, setError] = useState('');

  // 初始載入時，查看 localStorage 是否有檔案資料
  useEffect(() => {
    const b64 = localStorage.getItem('uploadedFileBase64');
    const fName = localStorage.getItem('uploadedFileName');
    if (b64) setPreviewBase64(b64);
    if (fName) setFileName(fName);
  }, []);

  const handleNext = async (e) => {
    e.preventDefault();

    // 若沒上傳檔案
    if (!previewBase64) {
      setError('No file selected. Please go back to Home and upload a file first.');
      return;
    }

    // 若必填欄位有缺
    if (!realName.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      setError('All fields (Real Name, Phone, Address, Email) are required.');
      return;
    }
    setError('');

    try {
      // 將 base64 字串轉為二進位 blob
      const byteString = atob(previewBase64.split(',')[1]);
      const mimeString = previewBase64.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // 組 formData
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('realName', realName);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('email', email);

      // 傳到後端 /api/protect/step1 (不需要 token)
      const res = await fetch('/api/protect/step1', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        // 後端若回傳錯誤訊息，就顯示出來
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || 'Server error');
      }

      // 成功 → 進到 Step2
      navigate('/protect/step2');
    } catch (err) {
      setError(err.message || 'Server error, please try again.');
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Step 1: Upload & Info</Title>

        <PreviewBox>
          <strong>Uploaded File Preview:</strong>
          {previewBase64 ? (
            isImageFile(fileName) ? (
              <>
                <PreviewImg src={previewBase64} alt="preview" />
                <FileName>{fileName}</FileName>
              </>
            ) : (
              <FileName>[Non-image File] {fileName}</FileName>
            )
          ) : (
            <p style={{ color: '#aaa' }}>No file found. Please go back to Home and upload first.</p>
          )}
        </PreviewBox>

        <Description>
          您已於首頁上傳檔案，我們將為您產出「原創著作證明」並保護您的著作權。<br/>
          EN: Please fill in your real info below (Real Name, Phone, etc.).
        </Description>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        {/* noValidate -> 避免 iOS Safari 堅持做 email pattern 驗證 */}
        <StyledForm onSubmit={handleNext} noValidate>
          <StyledLabel>真實姓名 (Real Name):</StyledLabel>
          <StyledInput
            type="text"
            value={realName}
            onChange={e => setRealName(e.target.value)}
          />

          <StyledLabel>電話 (Phone):</StyledLabel>
          <StyledInput
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />

          <StyledLabel>地址 (Address):</StyledLabel>
          <StyledInput
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />

          <StyledLabel>Email:</StyledLabel>
          {/* 可改成 type="text" 完全跳過瀏覽器檢查 */}
          <StyledInput
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <SubmitButton type="submit">Next</SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}

/** 
 * 辨別檔名是否為圖片 
 */
function isImageFile(filename = '') {
  const lower = filename.toLowerCase();
  return (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.gif')
  );
}
