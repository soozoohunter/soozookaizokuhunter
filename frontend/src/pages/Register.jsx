import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const FormContainer = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 2px solid #ff6f00;
  border-radius: 15px;
  background-color: #fffbea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Section = styled.div`
  border: 1px solid #ffcc70;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 10px;
  background-color: #fffdf5;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #f59e0b;
`;

const FormLabel = styled.label`
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
  font-weight: bold;
  color: #d97706;
`;

const FormInput = styled.input`
  padding: 0.5rem;
  margin-top: 0.25rem;
  font-size: 1rem;
  border-radius: 5px;
  border: 1px solid #fcd34d;
`;

const HintText = styled.p`
  text-align: center;
  font-size: 0.9rem;
  color: #d97706;
  margin: 1rem 0;
`;

const ErrorText = styled.p`
  color: red;
  text-align: center;
  margin-bottom: 1rem;
`;

const SubmitButton = styled.button`
  background-color: #f97316;
  color: white;
  padding: 0.75rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;

  &:hover {
    background-color: #ea580c;
  }
`;

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
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

  // onChange handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // onSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1) 前端檢查必填欄位: email, username, password, confirmPassword
    if (!formData.email.trim() || !formData.username.trim() || !formData.password || !formData.confirmPassword) {
      setError('必填欄位未填 (Please fill in all required fields)');
      return;
    }
    // 2) 密碼一致
    if (formData.password !== formData.confirmPassword) {
      setError('兩次輸入的密碼不一致 (Passwords do not match)');
      return;
    }
    // 3) 至少有一個社群/電商欄位
    const {
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, Taobao, eBay
    } = formData;
    const accounts = [IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay];
    const hasAccount = accounts.some(acc => acc.trim() !== '');
    if (!hasAccount) {
      setError('請至少填寫一個社群或電商帳號 (At least one social/e-commerce account)');
      return;
    }

    // 呼叫後端 /auth/register
    try {
      const resp = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await resp.json();
      if (!resp.ok) {
        // 註冊失敗 (後端 4xx or 5xx)
        setError(data.message || '註冊失敗 (Registration failed)');
      } else {
        alert(data.message || '註冊成功 (Registration successful)');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      setError('無法連接伺服器 (Cannot connect to server)');
    }
  };

  return (
    <FormContainer>
      <h2 style={{ color: '#f97316', textAlign: 'center' }}>
        用戶註冊 / User Registration
      </h2>

      {error && <ErrorText>{error}</ErrorText>}

      <form onSubmit={handleSubmit}>

        {/* 基本欄位 */}
        <FormLabel>
          電子郵件 Email
          <FormInput
            type="email"
            name="email"
            placeholder="輸入電子郵件 (Enter your email)"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </FormLabel>

        <FormLabel>
          用戶名稱 Username
          <FormInput
            type="text"
            name="username"
            placeholder="輸入用戶名稱 (Enter a username)"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </FormLabel>

        <FormLabel>
          密碼 Password
          <FormInput
            type="password"
            name="password"
            placeholder="輸入密碼 (Enter a password)"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </FormLabel>

        <FormLabel>
          確認密碼 Confirm Password
          <FormInput
            type="password"
            name="confirmPassword"
            placeholder="再次輸入密碼 (Re-enter the password)"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </FormLabel>

        {/* 社群平台帳號區域 */}
        <Section>
          <SectionTitle>社群平台帳號 (Social Accounts)</SectionTitle>
          <FormLabel>
            Instagram
            <FormInput
              type="text"
              name="IG"
              placeholder="Instagram 帳號 (optional)"
              value={formData.IG}
              onChange={handleChange}
            />
          </FormLabel>
          <FormLabel>
            Facebook
            <FormInput
              type="text"
              name="FB"
              placeholder="Facebook 帳號 (optional)"
              value={formData.FB}
              onChange={handleChange}
            />
          </FormLabel>
          <FormLabel>
            YouTube
            <FormInput
              type="text"
              name="YouTube"
              placeholder="YouTube 帳號 (optional)"
              value={formData.YouTube}
              onChange={handleChange}
            />
          </FormLabel>
          <FormLabel>
            TikTok
            <FormInput
              type="text"
              name="TikTok"
              placeholder="TikTok 帳號 (optional)"
              value={formData.TikTok}
              onChange={handleChange}
            />
          </FormLabel>
        </Section>

        <HintText>
          提供社群與電商帳號能證明原創性，確保你的內容受區塊鏈保護。<br/>
          (Providing social & e-commerce accounts helps prove originality on the blockchain.)
        </HintText>

        {/* 電商平台帳號區域 */}
        <Section>
          <SectionTitle>電商平台帳號 (E-Commerce Accounts)</SectionTitle>
          <FormLabel>
            Shopee
            <FormInput
              type="text"
              name="Shopee"
              placeholder="Shopee 帳號 (optional)"
              value={formData.Shopee}
              onChange={handleChange}
            />
          </FormLabel>
          <FormLabel>
            Ruten
            <FormInput
              type="text"
              name="Ruten"
              placeholder="Ruten 露天拍賣 (optional)"
              value={formData.Ruten}
              onChange={handleChange}
            />
          </FormLabel>
          <FormLabel>
            Yahoo
            <FormInput
              type="text"
              name="Yahoo"
              placeholder="Yahoo 拍賣帳號 (optional)"
              value={formData.Yahoo}
              onChange={handleChange}
            />
          </FormLabel>
          <FormLabel>
            Amazon
            <FormInput
              type="text"
              name="Amazon"
              placeholder="Amazon 帳號 (optional)"
              value={formData.Amazon}
              onChange={handleChange}
            />
          </FormLabel>
          <FormLabel>
            Taobao
            <FormInput
              type="text"
              name="Taobao"
              placeholder="Taobao / Tmall (optional)"
              value={formData.Taobao}
              onChange={handleChange}
            />
          </FormLabel>
          <FormLabel>
            eBay
            <FormInput
              type="text"
              name="eBay"
              placeholder="eBay 帳號 (optional)"
              value={formData.eBay}
              onChange={handleChange}
            />
          </FormLabel>
        </Section>

        <SubmitButton type="submit">
          提交註冊 / Submit Registration
        </SubmitButton>
      </form>
    </FormContainer>
  );
}
