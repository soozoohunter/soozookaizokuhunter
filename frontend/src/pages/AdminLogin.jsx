// frontend/src/pages/AdminLogin.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
  width: 100%;
  max-width: 400px;
  border: 2px solid #ff6f00;
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
  margin: 0.5rem 0 0.25rem;
  font-size: 0.9rem;
  color: #ffa500;
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
  background-color: #f97316;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  &:hover {
    background-color: #ea580c;
  }
`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('zacyao1005');
  const [password, setPassword] = useState('Zack967988');
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '登入失敗：請檢查帳號或密碼');
      } else {
        localStorage.setItem('token', data.token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('無法連線，請稍後再試');
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>Admin Login 管理員登入</Title>
        {error && <ErrorMsg>{error}</ErrorMsg>}

        <StyledForm onSubmit={handleLogin}>
          <StyledLabel>Email 或 帳號</StyledLabel>
          <StyledInput
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />

          <StyledLabel>密碼 / Password</StyledLabel>
          <StyledInput
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <SubmitButton type="submit">登入 / Login</SubmitButton>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
}
