import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 如果有啟用 captcha，需要的狀態 (如 captchaId, captchaText, userInputCaptcha)
  // 這裡略。若你已有 captcha 流程可自行加回去。

  const navigate = useNavigate();

  // (如有 captcha 流程) 在這裡 fetch captcha

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Body 若有 captchaId, captchaText 也一起放
      const body = {
        email,
        password
      };

      // 發送 POST /auth/login
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || '登入失敗');
      } else {
        // 儲存 token，跳轉
        localStorage.setItem('token', data.token);
        alert('登入成功');
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

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
            Email:
          </label>
          <input
            type="text"   // 用 text 以避免 iOS 說 pattern 不符
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
        </div>

        {/* 顯示錯誤訊息 */}
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

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
