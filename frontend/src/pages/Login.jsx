/**
 * Login.jsx
 * 
 * 修正後程式碼，可直接覆蓋原先檔案。
 * 部署前請先執行：npm install styled-components
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

// ----------- styled-components 設計 -----------
const Container = styled.div`
  min-height: 100vh;
  background: #000; 
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff; /* default text color white */
`;

const FormWrapper = styled.form`
  width: 90%;
  max-width: 400px;
  padding: 2rem;
`;

const Title = styled.h1`
  color: #FFD700; /* yellow title text */
  text-align: center;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 8px #FFD700; /* glow effect for title */
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
  background: #000;
  color: #fff;
  border: 1px solid
    ${props => (props.error ? 'red' : '#FFA500')};
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => (props.error ? 'red' : '#FFA500')};
    box-shadow: 0 0 6px ${props => (props.error ? 'red' : '#FFA500')};
  }

  &::placeholder {
    color: #999;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.6rem 1rem;
  background: #000;
  color: #FFD700;
  font-size: 1.1rem;
  font-weight: bold;
  border: 2px solid #FFA500;
  border-radius: 4px;
  cursor: pointer;
  text-shadow: 0 0 4px #FFD700;
  /* Add a slight glow on hover/focus for the button */
  &:hover,
  &:focus {
    outline: none;
    box-shadow: 0 0 8px #FFA500;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.9rem;
  margin: -0.8rem 0 1rem 0; 
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #fff;
`;

// ----------- 主元件 -----------
function Login() {
  const navigate = useNavigate();

  // 單一 form 狀態管理 (userName、password)
  const [form, setForm] = useState({
    userName: '',
    password: ''
  });

  // 單一錯誤訊息
  const [error, setError] = useState('');

  // 監聽表單輸入
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 前端基本驗證：欄位必填
    if (!form.userName.trim() || !form.password) {
      setError('請輸入使用者名稱與密碼 / Please enter username and password');
      return;
    }

    try {
      // 呼叫後端登入 API
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: form.userName.trim(),
          password: form.password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        // 若後端回傳非200，則顯示錯誤訊息
        throw new Error(
          data.message ||
            '登入失敗，請確認帳號密碼 / Login failed, please check your credentials'
        );
      }

      // 登入成功，若有 token 就存到 localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // 可在此導向首頁或儀表板
      navigate('/');
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    }
  };

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>登入 / Login</Title>

        {/* 使用者名稱 */}
        <Label htmlFor="userName">使用者名稱 / Username</Label>
        <Input
          id="userName"
          name="userName"
          type="text"
          placeholder="請輸入使用者名稱 / Enter username"
          value={form.userName}
          onChange={handleChange}
          // 若 error 與 form.userName 為空，則顯示紅框
          error={!!error && !form.userName.trim()}
        />

        {/* 密碼 */}
        <Label htmlFor="password">密碼 / Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="請輸入密碼 / Enter password"
          value={form.password}
          onChange={handleChange}
          // 若 error 與 form.password 為空，則顯示紅框
          error={!!error && !form.password}
        />

        {/* 一般錯誤訊息 (顯示在兩個欄位之後) */}
        {error && <ErrorText>{error}</ErrorText>}

        <Button type="submit">登入 / Login</Button>

        {/* 底部切換連結 */}
        <SwitchText>
          沒有帳號？{' '}
          <Link to="/register" style={{ color: '#FFD700' }}>
            註冊 / Register
          </Link>
        </SwitchText>
      </FormWrapper>
    </Container>
  );
}

export default Login;
