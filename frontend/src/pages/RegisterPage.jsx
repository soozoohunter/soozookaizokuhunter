// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
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
  width: 100%;
  max-width: 520px;
  border: 2px solid #ff6f00;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #FFD700;
`;

const ErrorMsg = styled.p`
  color: red;
  text-align: center;
  margin-bottom: 1rem;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const StyledLabel = styled.label`
  margin-top: 0.5rem;
  color: #ffa500;
  font-size: 0.9rem;
`;

const StyledInput = styled.input`
  margin-top: 0.25rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: #2c2c2c;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
`;

const Section = styled.div`
  border: 1px solid #ff6f00;
  padding: 1rem;
  margin-bottom: 1.25rem;
  border-radius: 6px;
  background-color: #2c2c2c;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #ffd700;
  font-size: 1rem;
`;

const GridTwoCols = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const SubmitButton = styled.button`
  padding: 0.75rem;
  background-color: #f97316;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #ea580c;
  }
`;

export default function Register() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    email: '',
    phone: '',    // phone number
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1) email, phone, password, confirmPassword
    if (!form.email.trim() || !form.phone.trim() || !form.password || !form.confirmPassword) {
      return setErrorMsg('必填欄位未填');
    }
    // 2) 密碼一致
    if (form.password !== form.confirmPassword) {
      return setErrorMsg('兩次密碼不一致');
    }

    // 3) 至少一個社群/電商帳號
    const accountsArr = [
      form.IG, form.FB, form.YouTube, form.TikTok,
      form.Shopee, form.Ruten, form.Yahoo, form.Amazon, form.Taobao, form.eBay
    ];
    if (!accountsArr.some(acc => acc.trim() !== '')) {
      return setErrorMsg('請至少填寫一個社群或電商帳號');
    }

    try {
      const response = await apiClient.post('/auth/register', form);
      alert(response.data.message || '註冊成功');
      navigate('/login');
    } catch (err) {
      const resp = err.response;
      if (resp?.status === 409) {
        setErrorMsg(resp.data?.message || '此電子郵件或手機號碼已被註冊。');
      } else {
        setErrorMsg(resp?.data?.message || err.message || '無法連接伺服器');
      }
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>用戶註冊 / Register</Title>
        {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}

        <StyledForm onSubmit={handleSubmit}>
          <StyledLabel>電子郵件 Email (必填)</StyledLabel>
          <StyledInput
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
          />

          <StyledLabel>手機號碼 Phone</StyledLabel>
          <StyledInput
            name="phone"
            type="text"
            placeholder="09xx-xxx-xxx"
            value={form.phone}
            onChange={handleChange}
          />

          <StyledLabel>密碼 Password</StyledLabel>
          <StyledInput
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
          />

          <StyledLabel>確認密碼 Confirm Password</StyledLabel>
          <StyledInput
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          <Section>
            <SectionTitle>社群平台 / Social Accounts</SectionTitle>
            <GridTwoCols>
              <StyledLabel>
                Instagram
                <StyledInput name="IG" type="text" value={form.IG} onChange={handleChange} />
              </StyledLabel>
              <StyledLabel>
                Facebook
                <StyledInput name="FB" type="text" value={form.FB} onChange={handleChange} />
              </StyledLabel>
              <StyledLabel>
                YouTube
                <StyledInput name="YouTube" type="text" value={form.YouTube} onChange={handleChange} />
              </StyledLabel>
              <StyledLabel>
                TikTok
                <StyledInput name="TikTok" type="text" value={form.TikTok} onChange={handleChange} />
              </StyledLabel>
            </GridTwoCols>
          </Section>

          <Section>
            <SectionTitle>電商平台 / E-Commerce Accounts</SectionTitle>
            <GridTwoCols>
              <StyledLabel>
                Shopee
                <StyledInput name="Shopee" type="text" value={form.Shopee} onChange={handleChange} />
              </StyledLabel>
              <StyledLabel>
                Ruten
                <StyledInput name="Ruten" type="text" value={form.Ruten} onChange={handleChange} />
              </StyledLabel>
              <StyledLabel>
                Yahoo
                <StyledInput name="Yahoo" type="text" value={form.Yahoo} onChange={handleChange} />
              </StyledLabel>
              <StyledLabel>
                Amazon
                <StyledInput name="Amazon" type="text" value={form.Amazon} onChange={handleChange} />
              </StyledLabel>
              <StyledLabel>
                Taobao
                <StyledInput name="Taobao" type="text" value={form.Taobao} onChange={handleChange} />
              </StyledLabel>
              <StyledLabel>
                eBay
                <StyledInput name="eBay" type="text" value={form.eBay} onChange={handleChange} />
              </StyledLabel>
            </GridTwoCols>
          </Section>

          <SubmitButton type="submit">提交註冊</SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
