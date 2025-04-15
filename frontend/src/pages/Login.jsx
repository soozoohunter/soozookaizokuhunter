import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

// Styled-components for styled UI elements
const Container = styled.div`
  min-height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff; /* default text color white */
`;

const Form = styled.form`
  width: 90%;
  max-width: 400px;
  padding: 2rem;
  /* Centering the form content vertically for larger screens if needed */
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
  border: 1px solid ${props => (props.error ? 'red' : '#FFA500')};
  border-radius: 4px;
  font-size: 1rem;
  /* Remove default outline and add glow on focus */
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
  &:hover, &:focus {
    outline: none;
    box-shadow: 0 0 8px #FFA500;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.9rem;
  margin: -0.8rem 0 1rem 0; /* position error text right below input */
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #fff;
`;

// Login component
function Login() {
  const navigate = useNavigate();
  // State for form fields
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  // State for error messages
  const [errorUserName, setErrorUserName] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorGeneral, setErrorGeneral] = useState(''); // general error (e.g. login failed)

  const handleLogin = async (e) => {
    e.preventDefault();
    // Reset general error
    setErrorGeneral('');
    let valid = true;
    // Basic front-end validation
    if (!userName.trim()) {
      setErrorUserName('請輸入使用者名稱 / Enter username');
      valid = false;
    } else {
      setErrorUserName('');
    }
    if (!password) {
      setErrorPassword('請輸入密碼 / Enter password');
      valid = false;
    } else {
      setErrorPassword('');
    }
    if (!valid) {
      return; // if any required field is empty, stop submission
    }
    try {
      // Call login API
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userName: userName.trim(), password: password })
      });
      if (!res.ok) {
        // If response is not OK, handle error
        // Optionally parse error message from backend:
        // const errData = await res.json(); setErrorGeneral(errData.message || '...');
        setErrorGeneral('登入失敗，請確認帳號密碼 / Login failed, please check your credentials');
      } else {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        // Redirect to home page after successful login
        navigate('/');
      }
    } catch (err) {
      // Network or unexpected error
      setErrorGeneral('登入發生錯誤 / An error occurred during login');
      console.error('Login error:', err);
    }
  };

  return (
    <Container>
      <Form onSubmit={handleLogin}>
        <Title>登入 / Login</Title>
        {/* Username field */}
        <Label htmlFor="username">使用者名稱 / Username</Label>
        <Input 
          id="username"
          type="text"
          placeholder="請輸入使用者名稱 / Enter username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          error={!!errorUserName}
        />
        {errorUserName && <ErrorText>{errorUserName}</ErrorText>}
        {/* Password field */}
        <Label htmlFor="password">密碼 / Password</Label>
        <Input 
          id="password"
          type="password"
          placeholder="請輸入密碼 / Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errorPassword}
        />
        {errorPassword && <ErrorText>{errorPassword}</ErrorText>}
        {/* General error (e.g. invalid credentials) */}
        {errorGeneral && <ErrorText>{errorGeneral}</ErrorText>}
        {/* Submit button */}
        <Button type="submit">登入 / Login</Button>
        {/* Switch to Register link */}
        <SwitchText>
          沒有帳號？ <Link to="/register" style={{color: '#FFD700'}}>註冊 / Register</Link>
        </SwitchText>
      </Form>
    </Container>
  );
}

export default Login;
