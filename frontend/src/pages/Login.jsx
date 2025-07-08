// frontend/src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import styled from 'styled-components';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #121212;
`;

const FormContainer = styled.div`
  background-color: #1e1e1e;
  padding: 2rem 2.5rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  border: 2px solid #ff6f00;
  color: #ffffff;
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
  background-color: #2c2c2c;
  color: #fff;
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
      // 後端僅接受 identifier 欄位，直接傳遞使用者輸入
      const payload = {
        identifier: identifier.trim(),
        password
      };

      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (!resp.ok) {
        setErrorMsg(data.message || '登入失敗');
        return;
      }

      if (data.token) {
        login(data.token);
      }
      alert(data.message || '登入成功');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg('伺服器錯誤');
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
            placeholder="09xx-xxx-xxx or you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <StyledLabel>密碼 / Password</StyledLabel>
          <StyledInput
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
