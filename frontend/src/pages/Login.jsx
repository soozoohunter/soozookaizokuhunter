// frontend/src/pages/Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 提交表單
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 準備要送給後端的資料
      const body = { email, password };

      // 發送 POST /auth/login
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        // 後端若回傳錯誤，顯示錯誤訊息
        setError(data.message || '登入失敗');
      } else {
        // 成功登入，儲存 Token
        localStorage.setItem('token', data.token);
        alert('登入成功');
        // 跳轉到首頁或會員專區
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('發生錯誤，請稍後再試');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: '2rem'
    }}>
      <form
        onSubmit={handleLogin}
        style={{
          textAlign: 'center',
          border: '2px solid orange',
          padding: '20px',
          borderRadius: '8px'
        }}
      >
        <h2 style={{ color: 'orange', marginBottom: '1rem' }}>Login</h2>

        {/* Email */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
            Email:
          </label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid orange'
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid orange'
            }}
          />
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <p style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'orange',
            border: 'none',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          登入
        </button>
      </form>
    </div>
  );
}

export default Login;
