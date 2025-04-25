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
  margin-bottom: 1rem;
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

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #ffa500;
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
  margin-top: 0.75rem;
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
  // ★ 新增：是否同意隱私與條款
  const [agreePolicy, setAgreePolicy] = useState(false);

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

    // 檢查必填
    if (!file) {
      return setError('請先上傳檔案');
    }
    if (!realName.trim() || !birthDate.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      return setError('必填欄位不可空白');
    }
    if (!title.trim()) {
      return setError('請輸入作品標題(Title)');
    }
    if (!keywords.trim()) {
      return setError('請輸入關鍵字(Keywords)');
    }
    if (!agreePolicy) {
      return setError('請勾選同意隱私權政策與使用條款');
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('realName', realName);
      formData.append('birthDate', birthDate);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('email', email);
      formData.append('title', title);
      formData.append('keywords', keywords);
      // 送出是否同意 (後端檢查 'true' 才放行)
      formData.append('agreePolicy', agreePolicy ? 'true' : 'false');

      const resp = await fetch('/api/protect/step1', {
        method: 'POST',
        body: formData
      });
      const respData = await resp.json();

      if (!resp.ok) {
        // 若後端回傳 409 => 顯示更友善訊息
        if (resp.status === 409) {
          throw new Error(respData.error || '此手機或Email已註冊，請直接登入');
        }
        // 其他錯誤
        throw new Error(respData.error || '上傳失敗');
      }

      // 成功 => respData 內含 pdfUrl / fileId / ...
      console.log('step1 success =>', respData);
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
        <Title>Step 1: Upload &amp; Member Info</Title>

        <Description>
          為了產出您的 <strong>原創著作證明書</strong>，請上傳作品並填寫基本資料。
          系統會自動為您建立會員帳號（手機為帳號、Email 唯一），
          並完成 SHA-256 指紋 + 區塊鏈存證。
        </Description>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <StyledForm onSubmit={handleNext}>
          <StyledLabel>上傳作品檔案 (Upload File):</StyledLabel>
          {!file ? (
            <StyledInput
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={handleFileChange}
            />
          ) : (
            <>
              <FileName>已選檔案: {file.name}</FileName>
              <ClearButton type="button" onClick={handleClearFile}>移除檔案</ClearButton>
            </>
          )}

          <StyledLabel>真實姓名 (RealName)</StyledLabel>
          <StyledInput
            type="text"
            placeholder="王小明 / John Wang"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
          />

          <StyledLabel>生日 (Birth Date)</StyledLabel>
          <StyledInput
            type="text"
            placeholder="1988-10-24"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />

          <StyledLabel>手機 (Phone) - 作為會員帳號</StyledLabel>
          <StyledInput
            type="text"
            placeholder="09xx-xxx-xxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <StyledLabel>地址 (Address)</StyledLabel>
          <StyledInput
            type="text"
            placeholder="台北市大安區..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <StyledLabel>Email</StyledLabel>
          <StyledInput
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <StyledLabel>作品標題 (Title)</StyledLabel>
          <StyledInput
            type="text"
            placeholder="My Artwork"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <StyledLabel>關鍵字 (Keywords)</StyledLabel>
          <StyledInput
            type="text"
            placeholder="art; painting; cat"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />

          {/* ====== 隱私權 & 條款 checkbox ====== */}
          <details style={{
            margin:'1rem 0',
            background:'#2c2c2c',
            padding:'1rem',
            border:'1px solid #ff6f00',
            borderRadius:'6px'
          }}>
            <summary style={{ cursor:'pointer', color:'#f97316' }}>
              閱讀隱私權與服務條款 (點此展開)
            </summary>
            <div style={{ fontSize:'0.85rem', marginTop:'0.5rem' }}>
              <p>本公司「凱盾全球國際股份有限公司(Epic Global Int’I Inc.)」隱私權保護政策...</p>
              <p>1. 您需年滿18歲...</p>
              <p>2. 蒐集與使用個人資料之目的...</p>
              <p>3. 若有違反規範，本公司得終止服務...</p>
              {/* 視需求再貼更完整文字 */}
            </div>
          </details>
          <CheckboxRow>
            <input
              type="checkbox"
              checked={agreePolicy}
              onChange={()=> setAgreePolicy(!agreePolicy)}
              style={{ marginRight:'0.5rem' }}
            />
            <span>我已閱讀並同意隱私權政策與使用條款</span>
          </CheckboxRow>
          {/* ================================ */}

          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Uploading...' : '下一步 / Next'}
          </SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
