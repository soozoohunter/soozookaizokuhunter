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
  max-width: 480px;
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

const FileName = styled.div`
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  color: #aaaaaa;
  word-break: break-all;
`;

const ClearButton = styled.button`
  margin-bottom: 1rem;
  background-color: #444;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-size: 0.8rem;
  &:hover {
    background-color: #666;
  }
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

  // ★ 新增：作品標題 (Title)
  const [title, setTitle] = useState('');

  // ★ 新增：關鍵字 (Keywords)
  const [keywords, setKeywords] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 檔案上傳事件
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 清除檔案
  const handleClearFile = () => {
    setFile(null);
  };

  // 按下 Next => 將資料 POST 給 /api/protect/step1
  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    // 簡易檢查
    if (!file) {
      return setError('請先上傳檔案 (Please upload a file).');
    }
    if (!realName.trim() || !birthDate.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      return setError('必填欄位不可空白。');
    }
    if (!title.trim()) {
      return setError('請輸入作品標題 (Title)！');
    }
    if (!keywords.trim()) {
      return setError('請輸入關鍵字 (Keywords)！');
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
      formData.append('title', title);        // 新增 title
      formData.append('keywords', keywords); // 新增 keywords

      const resp = await fetch('/api/protect/step1', {
        method: 'POST',
        body: formData
      });

      const respData = await resp.json(); // 無論 success or error 先 parse JSON

      if (!resp.ok) {
        // 後端回傳錯誤時 (e.g. 409 / 400 / 500)
        throw new Error(respData.error || `上傳失敗: HTTP ${resp.status}`);
      }

      // 成功 => respData 內有 pdfUrl / fileId / fingerprint / ipfsHash / txHash ...
      console.log('step1 success =>', respData);

      // 將後端回傳資訊存入 localStorage，讓 Step2 顯示
      localStorage.setItem('protectStep1', JSON.stringify(respData));

      // 前往 Step2
      navigate('/protect/step2');
    } catch (err) {
      console.error('step1 error =>', err);
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
          檔案將自動產生 Fingerprint (SHA-256) 並上傳 IPFS、寫入區塊鏈。
          <br /><br />
          <strong>作品標題</strong> 用於證書顯示；<br />
          <strong>關鍵字 (hashtags)</strong> 請用分號「;」或逗號「,」分隔，
          以便AI爬蟲更準確搜尋。
        </Description>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <StyledForm onSubmit={handleNext}>
          <StyledLabel>上傳作品檔案 (Upload File):</StyledLabel>
          {!file && (
            <StyledInput
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={handleFileChange}
            />
          )}
          {file && (
            <>
              <FileName>已選檔案：{file.name}</FileName>
              <ClearButton type="button" onClick={handleClearFile}>
                移除檔案
              </ClearButton>
            </>
          )}

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
            placeholder="e.g. 1988-10-24"
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
            placeholder="e.g. 台北市大安區泰順街xx號"
          />

          <StyledLabel>Email:</StyledLabel>
          <StyledInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. yourmail@example.com"
          />

          <StyledLabel>作品標題 (Title):</StyledLabel>
          <StyledInput
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 我的插畫作品 / My Artwork"
          />

          <StyledLabel>關鍵字 (Keywords; 用分號或逗號分隔):</StyledLabel>
          <StyledInput
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. art; painting; cat"
          />

          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Next'}
          </SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
