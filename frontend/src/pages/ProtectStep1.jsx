// frontend/src/pages/ProtectStep1.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

/* === 動畫定義 === */
/* 背景漸層流動 */
const gradientFlow = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

/* 霓虹光暈 (加強) */
const neonGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px #ff6f00;
  }
  50% {
    box-shadow: 0 0 25px #ff6f00;
  }
`;

/* 旋轉 loader */
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

/* === 主要容器、背景 === */
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(-45deg, #202020, #1a1a1a, #2a2a2a, #0f0f0f);
  background-size: 500% 500%;
  animation: ${gradientFlow} 10s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

/* 表單容器 */
const FormContainer = styled.div`
  background-color: rgba(20, 20, 20, 0.8);
  width: 95%;
  max-width: 600px;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  border: 1px solid #444;
  animation: ${neonGlow} 2s ease-in-out infinite alternate;
`;

/* 標題 */
const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.2rem;
  color: #FFD700;
  font-weight: 700;
  letter-spacing: 1px;
`;

/* 文字描述(置中) */
const Description = styled.p`
  text-align: center;
  font-size: 0.95rem;
  color: #ccc;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

/* 錯誤訊息 */
const ErrorMsg = styled.div`
  background: #ff4444;
  color: #fff;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
`;

/* 使用 Grid 排列表單 */
const StyledForm = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 1rem;
  row-gap: 1rem;
`;

/* label整行 */
const FullLabel = styled.label`
  grid-column: 1 / 3;
  font-size: 0.9rem;
  color: #ffa500;
  margin-bottom: 0.25rem;
`;

/* label半行 */
const HalfLabel = styled.label`
  font-size: 0.9rem;
  color: #ffa500;
  margin-bottom: 0.25rem;
`;

/* input */
const StyledInput = styled.input`
  background: #2c2c2c;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
  width: 100%;
`;

/* show file name & remove button row */
const FileRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

/* 檔案名顯示 */
const FileName = styled.span`
  font-size: 0.85rem;
  color: #aaa;
  word-break: break-all;
`;

/* 移除檔案按鈕 */
const ClearButton = styled.button`
  background: #444;
  color: #fff;
  border: none;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #666;
  }
`;

/* 單列 */
const FullRow = styled.div`
  grid-column: 1 / 3;
`;

/* CheckBox Row */
const CheckboxRow = styled.div`
  grid-column: 1 / 3;
  display: flex;
  align-items: center;
  color: #ffa500;
  margin-top: 0.5rem;
`;

/* 按鈕 + 螢光 Hover */
const SubmitButton = styled.button`
  grid-column: 1 / 3;
  background-color: #f97316;
  color: #fff;
  border: 2px solid transparent;
  padding: 0.75rem 1.2rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  margin-top: 0.75rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: #ea580c;
    border-color: #ffaa00;
    box-shadow: 0 0 8px #ff9900;
  }
`;

/* Loading Spinner */
const Spinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  margin-right: 0.5rem;
  animation: ${spin} 0.8s linear infinite;
`;

export default function ProtectStep1() {
  const navigate = useNavigate();

  // 上傳檔案 & 基本資訊
  const [file, setFile] = useState(null);
  const [realName, setRealName] = useState('');
  const [birthDate, setBirthDate] = useState('');    // 改成 yyyy-MM-dd
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [enableProtection, setEnableProtection] = useState(false);

  // 狀態管理
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 檔案變更
  const handleFileChange = e => {
    setFile(e.target.files?.[0] || null);
  };

  // 移除檔案
  const handleClearFile = () => {
    setFile(null);
  };

  // 提交事件
  const handleSubmit = async e => {
    e.preventDefault();     // 取消原生 HTML5 驗證
    setError('');

    // 前端檢查
    if (!file) return setError('請先上傳檔案');
    if (!realName.trim()) return setError('姓名必填');
    if (!birthDate.trim()) return setError('生日必填');
    if (!phone.trim()) return setError('電話必填');
    if (!address.trim()) return setError('地址必填');
    if (!email.trim()) return setError('Email 必填');
    if (!title.trim()) return setError('作品標題必填');
    if (!keywords.trim()) return setError('關鍵字必填');
    if (!agreePolicy) return setError('請同意隱私權政策與使用條款');

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
      formData.append('agreePolicy', 'true');
      formData.append('enableProtection', enableProtection ? 'true' : 'false');

      const resp = await fetch('/api/protect/step1', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || data.error || `Error ${resp.status}`);

      const file = data.file || {};
      const step1Data = {
        fileId: file.id,
        fingerprint: file.fingerprint,
        ipfsHash: file.ipfs_hash,
        txHash: file.tx_hash,
        pdfUrl: data.pdfUrl || file.pdfUrl || '',
        publicImageUrl: data.publicImageUrl || file.publicImageUrl || ''
      };

      localStorage.setItem('protectStep1', JSON.stringify(step1Data));
      navigate('/protect/step2');
    } catch (err) {
      setError(err.message || '上傳失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Step 1: Upload & Member Info</Title>
        <Description>
          為了產出您的 <strong>原創著作證明書</strong>，請上傳作品並填寫以下資訊。<br />
          系統會自動為您建立會員帳號（手機為帳號、Email 唯一），並完成 SHA-256 指紋 + 區塊鏈存證。
        </Description>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        {/* noValidate 取消瀏覽器預設 pattern 驗證 */}
        <StyledForm onSubmit={handleSubmit} noValidate>
          <FullLabel>上傳作品檔案 (Upload File)</FullLabel>
          <FullRow>
            {!file ? (
              <StyledInput
                type="file"
                accept="image/*,video/*,application/pdf"
                onChange={handleFileChange}
              />
            ) : (
              <FileRow>
                <FileName>已選檔案: {file.name}</FileName>
                <ClearButton type="button" onClick={handleClearFile}>
                  移除檔案
                </ClearButton>
              </FileRow>
            )}
          </FullRow>

          <HalfLabel>真實姓名 (RealName)</HalfLabel>
          <HalfLabel>生日 (BirthDate)</HalfLabel>
          <StyledInput
            type="text"
            placeholder="王小明 / John Wang"
            value={realName}
            onChange={e => setRealName(e.target.value)}
          />
          {/* 改用 date */}
          <StyledInput
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
          />

          <HalfLabel>手機 (Phone)</HalfLabel>
          <HalfLabel>地址 (Address)</HalfLabel>
          {/* 改用 tel，並移除破折號 */}
          <StyledInput
            type="tel"
            placeholder="0900296168"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <StyledInput
            type="text"
            placeholder="台北市大安區..."
            value={address}
            onChange={e => setAddress(e.target.value)}
          />

          <FullLabel>Email</FullLabel>
          <FullRow>
            <StyledInput
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </FullRow>

          <HalfLabel>作品標題 (Title)</HalfLabel>
          <HalfLabel>關鍵字 (Keywords)</HalfLabel>
          <StyledInput
            type="text"
            placeholder="My Artwork"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <StyledInput
            type="text"
            placeholder="art; painting; cat"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
          />

          {/* 服務條款細則 */}
          <FullRow>
            <details
              style={{
                background: '#2c2c2c',
                padding: '1rem',
                border: '1px solid #444',
                borderRadius: '4px',
                marginTop: '1rem'
              }}
            >
              <summary
                style={{ cursor: 'pointer', color: '#f97316', fontWeight: 'bold' }}
              >
                閱讀隱私權與服務條款 (點此展開)
              </summary>
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
                <p>本公司「凱盾全球國際股份有限公司」隱私權保護政策…</p>
                <p>1. 您需年滿18歲…</p>
                <p>2. 蒐集與使用個人資料之目的…</p>
                <p>3. 若有違反規範，本公司得終止服務…</p>
              </div>
            </details>
          </FullRow>

          <CheckboxRow>
            <input
              type="checkbox"
              checked={agreePolicy}
              onChange={() => setAgreePolicy(!agreePolicy)}
              style={{ marginRight: '0.5rem' }}
            />
            <span>我已閱讀並同意隱私權政策與使用條款</span>
          </CheckboxRow>

          <CheckboxRow>
            <input
              type="checkbox"
              checked={enableProtection}
              onChange={() => setEnableProtection(!enableProtection)}
              style={{ marginRight: '0.5rem' }}
            />
            <span>啟用防側錄 (對抗擾動 + 高頻閃爍)</span>
          </CheckboxRow>

          <SubmitButton type="submit" disabled={loading}>
            {loading && <Spinner />}
            {loading ? 'Uploading...' : '下一步 / Next'}
          </SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
