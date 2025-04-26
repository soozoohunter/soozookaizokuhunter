import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const PageWrapper = styled.div`
  max-width: 650px;
  margin: 40px auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  font-family: 'Helvetica', 'Arial', sans-serif;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
`;

const FormContainer = styled.div`
  margin: 0 auto;
`;

const Title = styled.h2`
  margin-bottom: 0.5rem;
  color: #333;
  text-align: center;
  font-weight: 600;
`;

const Description = styled.p`
  margin-bottom: 1.5rem;
  color: #555;
  line-height: 1.5;
  text-align: center;
`;

const ErrorMsg = styled.p`
  margin: 1rem 0;
  color: #fff;
  background: #dc3545;
  padding: 0.75rem 1rem;
  border-radius: 4px;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StyledLabel = styled.label`
  font-weight: 500;
  color: #444;
`;

const StyledInput = styled.input`
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const FileName = styled.div`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
`;

const ClearButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  background: #ff6b6b;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  &:hover {
    background: #fa5252;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #333;
`;

const SubmitButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #218838;
  }
`;

export default function ProtectStep1() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [realName, setRealName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [agreePolicy, setAgreePolicy] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    // 基本檢查
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
      formData.append('agreePolicy', agreePolicy ? 'true' : 'false');

      const resp = await fetch('/api/protect/step1', {
        method: 'POST',
        body: formData
      });
      const respData = await resp.json();

      if (!resp.ok) {
        // 分析常見錯誤碼
        switch(resp.status) {
          case 400:
            throw new Error(respData.error || '表單資料有誤');
          case 402:
            throw new Error(respData.error || '短影音上傳需付費');
          case 409:
            if (respData.code === 'ALREADY_MEMBER') {
              alert(respData.error || '您已是會員，請直接登入或註冊');
              navigate('/register');
              return;
            }
            throw new Error(respData.error || '重複的Email/Phone');
          case 413:
            // 413 => Nginx or Express => Payload Too Large
            throw new Error('檔案過大，請確認檔案大小或已放寬上限');
          default:
            throw new Error(respData.error || `上傳失敗，錯誤碼 ${resp.status}`);
        }
      }

      // 成功
      console.log('step1 success =>', respData);
      localStorage.setItem('protectStep1', JSON.stringify(respData));
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
          為了產出您的 <strong>原創著作證明書</strong>，請上傳作品並填寫基本資料。<br/>
          系統會自動為您建立會員帳號（手機為帳號、Email 唯一），<br/>
          並完成 SHA-256 指紋 + 區塊鏈存證。
        </Description>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <StyledForm onSubmit={handleNext}>
          <div>
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
                <ClearButton type="button" onClick={handleClearFile}>
                  移除檔案
                </ClearButton>
              </>
            )}
          </div>

          <div>
            <StyledLabel>真實姓名 (RealName)</StyledLabel>
            <StyledInput
              type="text"
              placeholder="王小明 / John Wang"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
            />
          </div>

          <div>
            <StyledLabel>生日 (Birth Date)</StyledLabel>
            <StyledInput
              type="text"
              placeholder="1988-10-24"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div>
            <StyledLabel>手機 (Phone) - 作為會員帳號</StyledLabel>
            <StyledInput
              type="text"
              placeholder="09xx-xxx-xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <StyledLabel>地址 (Address)</StyledLabel>
            <StyledInput
              type="text"
              placeholder="台北市大安區..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <StyledLabel>Email</StyledLabel>
            <StyledInput
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <StyledLabel>作品標題 (Title)</StyledLabel>
            <StyledInput
              type="text"
              placeholder="My Artwork"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <StyledLabel>關鍵字 (Keywords)</StyledLabel>
            <StyledInput
              type="text"
              placeholder="art; painting; cat"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <details style={{
            margin: '1rem 0',
            background: '#e9ecef',
            padding: '1rem',
            border: '1px solid #ced4da',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            <summary style={{ cursor: 'pointer', color: '#007bff', fontWeight: 'bold' }}>
              閱讀隱私權與服務條款 (點此展開)
            </summary>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#444' }}>
              <p>本公司「凱盾全球國際股份有限公司」隱私權保護政策...</p>
              <p>1. 您需年滿18歲...</p>
              <p>2. 蒐集與使用個人資料之目的...</p>
              <p>3. 若有違反規範，本公司得終止服務...</p>
            </div>
          </details>

          <CheckboxRow>
            <input
              type="checkbox"
              checked={agreePolicy}
              onChange={() => setAgreePolicy(!agreePolicy)}
            />
            <span>我已閱讀並同意隱私權政策與使用條款</span>
          </CheckboxRow>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Uploading...' : '下一步 / Next'}
          </SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
