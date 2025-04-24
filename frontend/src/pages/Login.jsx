// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 400px;
  border: 2px solid #ff6f00; /* 橘色外框 */
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
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 如果含 '@'，則視為 email，否則 username
    let payload;
    if (identifier.includes('@')) {
      payload = { email: identifier.trim().toLowerCase(), password };
    } else {
      payload = { username: identifier.trim(), password };
    }

    try {
      const resp = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setErrorMsg(data.message || '登入失敗 (Login failed)');
      } else {
        // 成功 => 儲存 token，導向首頁
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        alert(data.message || '登入成功');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('無法連接伺服器 (Cannot connect to server)');
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>登入 / Login</Title>
        {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}

        <StyledForm onSubmit={handleSubmit}>
          <StyledLabel>帳號 (Email 或 Username)</StyledLabel>
          <StyledInput
            placeholder="Enter email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <StyledLabel>密碼 / Password</StyledLabel>
          <StyledInput
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <SubmitButton type="submit">
            登入 / Login
          </SubmitButton>
        </StyledForm>

        <SwitchPrompt>
          尚未註冊？ <Link to="/register">註冊帳號</Link>
        </SwitchPrompt>
      </FormContainer>
    </PageWrapper>
  );
}
