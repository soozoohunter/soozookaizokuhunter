import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// 與 Login 頁面風格相似的暗色背景 + 橘色重點
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
  max-width: 450px;
  border: 2px solid #ff6f00; /* 橘色外框 */
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #FFD700; /* 金色文字 */
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

const Section = styled.div`
  border: 1px solid #ff6f00;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  background-color: #2c2c2c;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #ffd700;
  font-size: 1rem;
`;

const HintText = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: #fca503;
  margin: 1rem 0;
`;

const ErrorMsg = styled.p`
  color: red;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
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

export default function Register() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  // 統一放入一個物件中
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    IG: '',
    FB: '',
    YouTube: '',
    TikTok: '',
    Shopee: '',
    Ruten: '',
    Yahoo: '',
    Amazon: '',
    Taobao: '',
    eBay: ''
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1) 前端檢查必填
    if (!form.email.trim() || !form.username.trim() 
        || !form.password || !form.confirmPassword) {
      return setErrorMsg('必填欄位未填 (Please fill in all required fields)');
    }
    // 2) 密碼一致
    if (form.password !== form.confirmPassword) {
      return setErrorMsg('兩次輸入的密碼不一致 (Passwords do not match)');
    }
    // 3) 至少一個社群/電商欄位
    const { IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay } = form;
    const accounts = [IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay];
    const hasAccount = accounts.some(acc => acc.trim() !== '');
    if (!hasAccount) {
      return setErrorMsg('請至少填寫一個社群或電商帳號 (At least one social/e-commerce account)');
    }

    // 呼叫後端 /auth/register
    try {
      const resp = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await resp.json();

      if (!resp.ok) {
        setErrorMsg(data.message || '註冊失敗 (Registration failed)');
      } else {
        alert(data.message || '註冊成功 (Registration successful)');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('無法連接伺服器 (Cannot connect to server)');
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>用戶註冊 / Register</Title>

        {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}

        <StyledForm onSubmit={handleSubmit}>
          {/* Email */}
          <StyledLabel>電子郵件 Email</StyledLabel>
          <StyledInput 
            name="email" 
            type="email" 
            placeholder="Enter your email" 
            value={form.email}
            onChange={handleChange}
            required
          />

          {/* Username */}
          <StyledLabel>用戶名稱 Username</StyledLabel>
          <StyledInput 
            name="username"
            type="text"
            placeholder="Enter username"
            value={form.username}
            onChange={handleChange}
            required
          />

          {/* Password */}
          <StyledLabel>密碼 Password</StyledLabel>
          <StyledInput 
            name="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {/* Confirm */}
          <StyledLabel>確認密碼 Confirm Password</StyledLabel>
          <StyledInput 
            name="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          {/* 社群平台 */}
          <Section>
            <SectionTitle>社群平台 / Social Accounts</SectionTitle>
            <StyledLabel>
              Instagram
              <StyledInput 
                name="IG"
                type="text"
                placeholder="Instagram (optional)"
                value={form.IG}
                onChange={handleChange}
              />
            </StyledLabel>
            <StyledLabel>
              Facebook
              <StyledInput 
                name="FB"
                type="text"
                placeholder="Facebook (optional)"
                value={form.FB}
                onChange={handleChange}
              />
            </StyledLabel>
            <StyledLabel>
              YouTube
              <StyledInput 
                name="YouTube"
                type="text"
                placeholder="YouTube (optional)"
                value={form.YouTube}
                onChange={handleChange}
              />
            </StyledLabel>
            <StyledLabel>
              TikTok
              <StyledInput 
                name="TikTok"
                type="text"
                placeholder="TikTok (optional)"
                value={form.TikTok}
                onChange={handleChange}
              />
            </StyledLabel>
          </Section>

          <HintText>
            提供社群與電商帳號能證明原創性，確保你的內容受區塊鏈保護。<br/>
            (Providing social & e-commerce accounts helps prove originality on the blockchain.)
          </HintText>

          {/* 電商平台 */}
          <Section>
            <SectionTitle>電商平台 / E-Commerce Accounts</SectionTitle>
            <StyledLabel>
              Shopee
              <StyledInput
                name="Shopee"
                type="text"
                placeholder="Shopee (optional)"
                value={form.Shopee}
                onChange={handleChange}
              />
            </StyledLabel>
            <StyledLabel>
              Ruten
              <StyledInput
                name="Ruten"
                type="text"
                placeholder="Ruten (optional)"
                value={form.Ruten}
                onChange={handleChange}
              />
            </StyledLabel>
            <StyledLabel>
              Yahoo
              <StyledInput
                name="Yahoo"
                type="text"
                placeholder="Yahoo Auction (optional)"
                value={form.Yahoo}
                onChange={handleChange}
              />
            </StyledLabel>
            <StyledLabel>
              Amazon
              <StyledInput
                name="Amazon"
                type="text"
                placeholder="Amazon (optional)"
                value={form.Amazon}
                onChange={handleChange}
              />
            </StyledLabel>
            <StyledLabel>
              Taobao
              <StyledInput
                name="Taobao"
                type="text"
                placeholder="Taobao/Tmall (optional)"
                value={form.Taobao}
                onChange={handleChange}
              />
            </StyledLabel>
            <StyledLabel>
              eBay
              <StyledInput
                name="eBay"
                type="text"
                placeholder="eBay (optional)"
                value={form.eBay}
                onChange={handleChange}
              />
            </StyledLabel>
          </Section>

          <SubmitButton type="submit">
            提交註冊 / Submit
          </SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
