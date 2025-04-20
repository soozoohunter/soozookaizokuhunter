import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); // email or userName
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async(e) => {
    e.preventDefault();
    setErrMsg('');

    // 若含 '@' => 視為 email，否則 userName
    let payload;
    if (identifier.includes('@')) {
      payload = { email: identifier.trim().toLowerCase(), password };
    } else {
      payload = { userName: identifier.trim(), password };
    }

    try {
      const resp = await fetch('/auth/login', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      // 成功 => 儲存 token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      alert('登入成功 / Login successful');
      navigate('/');
    } catch (err) {
      setErrMsg(err.message);
    }
  };

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>登入 / Login</Title>
        {errMsg && <ErrorText>{errMsg}</ErrorText>}

        <Label>帳號 (Email 或 使用者名稱)</Label>
        <Input
          placeholder="Enter email or username"
          value={identifier}
          onChange={e=>setIdentifier(e.target.value)}
        />

        <Label>密碼 / Password</Label>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />

        <Button type="submit">登入 / Login</Button>

        <SwitchText>
          尚未註冊？
          <Link to="/register" style={{ color:'#FFD700', marginLeft:'6px' }}>註冊 / Register</Link>
        </SwitchText>
      </FormWrapper>
    </Container>
  );
}

/* ============ styled-components ============ */
const Container = styled.div`
  background: #000;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

const FormWrapper = styled.form`
  width: 90%;
  max-width: 400px;
  background: #101010;
  border: 2px solid #ff6f00;
  border-radius: 8px;
  padding: 2rem;
`;
const Title = styled.h1`
  color: #FFD700;
  text-align: center;
  margin-bottom: 1.5rem;
`;
const Label = styled.label`
  margin-top: 1rem;
  font-weight: bold;
  display: block;
`;
const Input = styled.input`
  width: 100%;
  margin-bottom: 0.8rem;
  padding: 0.5rem;
  border: 1px solid #FFA500;
  border-radius: 4px;
  background: #000;
  color: #fff;
  &:focus {
    outline: none;
    border-color: #FFA500;
    box-shadow: 0 0 6px #FFA500;
  }
`;
const Button = styled.button`
  width: 100%;
  padding: 0.6rem 1rem;
  margin-top: 1rem;
  background: #000;
  border: 2px solid #FFA500;
  border-radius: 4px;
  color: #FFD700;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    box-shadow: 0 0 6px #FFA500;
  }
`;
const ErrorText = styled.div`
  color: red;
  margin-bottom: 1rem;
`;
const SwitchText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;
