// frontend/src/pages/Login.jsx (最終版)
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import apiClient from '../utils/apiClient';
import styled from 'styled-components';

const PageWrapper = styled.div`
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
`;
const FormContainer = styled.div`
  background-color: #1e1e1e;
  padding: 2rem 2.5rem;
  border-radius: 8px;
  width: 100%;
  max-width: 420px;
  border: 1px solid #F97316;
  color: #ffffff;
  box-shadow: 0 0 25px rgba(249, 115, 22, 0.2);
`;
const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #FFD700;
`;
const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;
const StyledLabel = styled.label`
  margin-bottom: 0.5rem;
`;
const StyledInput = styled.input`
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  border: 1px solid #4B5563;
  background-color: #374151;
  color: #FFFFFF;
  font-size: 1rem;
`;
const ErrorMsg = styled.p`
  color: #F87171;
  text-align: center;
  margin-bottom: 1rem;
`;
const SubmitButton = styled.button`
  padding: 0.75rem;
  background-color: #f97316;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background-color: #ea580c;
  }
`;
const SwitchPrompt = styled.p`
  margin-top: 1.5rem;
  font-size: 0.9rem;
  text-align: center;
  a {
    color: #4caf50;
    text-decoration: none;
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        identifier: identifier.trim(),
        password: password,
      };
      const response = await apiClient.post('/api/auth/login', payload);
      login(response.data.token);
      alert(response.data.message || '登入成功');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || '伺服器登入時發生錯誤。';
      setErrorMsg(message);
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>登入 / Login</Title>
        {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}
        <StyledForm onSubmit={handleSubmit}>
          <StyledLabel>帳號 (手機號碼 or Email)</StyledLabel>
          <StyledInput
            placeholder="請輸入您的手機號碼或 Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <StyledLabel>密碼 / Password</StyledLabel>
          <StyledInput
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <SubmitButton type="submit">登入 / Login</SubmitButton>
        </StyledForm>
        <SwitchPrompt>
          尚未註冊？ <Link to="/register">前往註冊</Link>
        </SwitchPrompt>
      </FormContainer>
    </PageWrapper>
  );
}
