import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const FormContainer = styled.div`
  max-width: 500px;
  margin: 2rem auto;
  padding: 1rem;
`;

const Section = styled.div`
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.5rem 0;
`;

const FormLabel = styled.label`
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const FormInput = styled.input`
  padding: 0.5rem;
  margin-top: 0.25rem;
  font-size: 1rem;
`;

const HintText = styled.p`
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  margin: 1rem 0;
`;

const ErrorText = styled.p`
  color: red;
  text-align: center;
  margin-bottom: 1rem;
`;

const Register = () => {
  const navigate = useNavigate();
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
  const [error, setError] = useState('');

  // 通用的輸入變更處理器
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 前端驗證：確認密碼一致，至少一個社群/電商帳號
    if (formData.password !== formData.confirmPassword) {
      setError('兩次輸入的密碼不一致 (Passwords do not match)');
      return;
    }
    // 檢查至少填寫一個平台帳號
    const {
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, Taobao, eBay
    } = formData;
    const socialAccounts = [IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, Taobao, eBay];
    const hasAccount = socialAccounts.some(acc => acc && acc.trim() !== '');
    if (!hasAccount) {
      setError('請提供至少一個社群或電商平台帳號 (At least one social or e-commerce account is required)');
      return;
    }

    try {
      // 發送 POST 請求到後端 API
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json().catch(() => ({}));  // 確保 JSON parse 不出錯
      if (!response.ok) {
        // 後端返回錯誤，顯示錯誤訊息
        setError(data.message || '發生未知錯誤 (An unknown error occurred)');
      } else {
        // 註冊成功，導向登入頁面
        alert(data.message || '註冊成功，請登入 (Registration successful, please log in)');
        navigate('/login');
      }
    } catch (err) {
      // 處理網絡或其他錯誤
      console.error('Registration error:', err);
      setError('無法連接伺服器，請稍後再試 (Cannot connect to server, please try again later)');
    }
  };

  return (
    <FormContainer>
      <h2>用戶註冊 / User Registration</h2>
      {error && <ErrorText>{error}</ErrorText>}
      <form onSubmit={handleSubmit}>
        {/* 基本資訊欄位 */}
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
            placeholder="請輸入密碼 (Enter a password)" 
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
          <SectionTitle>社群平台帳號 Social Accounts</SectionTitle>
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
              placeholder="YouTube 頻道或帳號 (optional)" 
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

        {/* 提示文字：鼓勵多平台 */}
        <HintText>
          提供多個社群或電商帳號有助於建立信任度  
          (Providing multiple social/e-commerce accounts helps build trust)
        </HintText>

        {/* 電商平台帳號區域 */}
        <Section>
          <SectionTitle>電商平台帳號 E-Commerce Accounts</SectionTitle>
          <FormLabel>
            Shopee
            <FormInput 
              type="text" 
              name="Shopee" 
              placeholder="Shopee 商店帳號 (optional)" 
              value={formData.Shopee} 
              onChange={handleChange} 
            />
          </FormLabel>
          <FormLabel>
            露天拍賣 Ruten
            <FormInput 
              type="text" 
              name="Ruten" 
              placeholder="露天拍賣帳號 (optional)" 
              value={formData.Ruten} 
              onChange={handleChange} 
            />
          </FormLabel>
          <FormLabel>
            Yahoo拍賣 Yahoo
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
              placeholder="Amazon 賣家帳號 (optional)" 
              value={formData.Amazon} 
              onChange={handleChange} 
            />
          </FormLabel>
          <FormLabel>
            淘寶 Taobao
            <FormInput 
              type="text" 
              name="Taobao" 
              placeholder="淘寶帳號 (optional)" 
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

        <button type="submit">提交註冊 Submit</button>
      </form>
    </FormContainer>
  );
};

export default Register;
