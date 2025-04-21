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

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    IG: '', FB: '', YouTube: '', TikTok: '',
    Shopee: '', Ruten: '', Yahoo: '', Amazon: '', Taobao: '', eBay: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('兩次輸入的密碼不一致 (Passwords do not match)');
      return;
    }

    const socialAccounts = [formData.IG, formData.FB, formData.YouTube, formData.TikTok, formData.Shopee, formData.Ruten, formData.Yahoo, formData.Amazon, formData.Taobao, formData.eBay];
    const hasAccount = socialAccounts.some(acc => acc.trim() !== '');

    if (!hasAccount) {
      setError('請提供至少一個社群或電商平台帳號 (At least one social or e-commerce account is required)');
      return;
    }

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || '發生未知錯誤 (An unknown error occurred)');
      } else {
        alert(data.message || '註冊成功，請登入 (Registration successful, please log in)');
        navigate('/login');
      }
    } catch (err) {
      setError('無法連接伺服器，請稍後再試 (Cannot connect to server, please try again later)');
    }
  };

  return (
    <FormContainer>
      <h2 style={{ color: '#f97316', textAlign: 'center' }}>用戶註冊 / User Registration</h2>
      {error && <ErrorText>{error}</ErrorText>}
      <form onSubmit={handleSubmit}>
        {['email', 'username', 'password', 'confirmPassword'].map(field => (
          <FormLabel key={field}>
            {field === 'email' ? '電子郵件 Email' : field === 'username' ? '用戶名稱 Username' : field === 'password' ? '密碼 Password' : '確認密碼 Confirm Password'}
            <FormInput
              type={field.includes('password') ? 'password' : 'text'}
              name={field}
              placeholder={`輸入${field.includes('password') ? '密碼' : field} (Enter ${field})`}
              value={formData[field]}
              onChange={handleChange}
              required
            />
          </FormLabel>
        ))}

        <Section>
          <SectionTitle>社群平台帳號 Social Accounts</SectionTitle>
          {['IG', 'FB', 'YouTube', 'TikTok'].map((item) => (
            <FormLabel key={item}>{item}
              <FormInput type="text" name={item} placeholder={`${item} 帳號 (optional)`} value={formData[item]} onChange={handleChange} />
            </FormLabel>
          ))}
        </Section>

        <HintText>
          提供社群與電商帳號能證明原創性，確保你的內容受區塊鏈保護。<br />
          Providing social and e-commerce accounts proves your originality and ensures your content is blockchain-protected.
        </HintText>

        <Section>
          <SectionTitle>電商平台帳號 E-Commerce Accounts</SectionTitle>
          {['Shopee', 'Ruten', 'Yahoo', 'Amazon', 'Taobao', 'eBay'].map((item) => (
            <FormLabel key={item}>{item}
              <FormInput type="text" name={item} placeholder={`${item} 帳號 (optional)`} value={formData[item]} onChange={handleChange} />
            </FormLabel>
          ))}
        </Section>

        <SubmitButton type="submit">提交註冊 Submit Registration</SubmitButton>
      </form>
    </FormContainer>
  );
};

export default Register;
