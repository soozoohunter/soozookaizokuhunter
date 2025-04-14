// frontend/src/pages/Login.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // CAPTCHA
  const [captchaId, setCaptchaId] = useState('');
  const [captchaText, setCaptchaText] = useState('');  // 後端回傳的文字
  const [userInputCaptcha, setUserInputCaptcha] = useState('');
  
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 一進來抓後端 captcha
  const fetchCaptcha = async () => {
    try {
      const res = await fetch('/auth/captcha');
      if (!res.ok) throw new Error('無法取得驗證碼');
      const data = await res.json();
      setCaptchaId(data.captchaId);
      setCaptchaText(data.captchaText);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleRefreshCaptcha = () => {
    fetchCaptcha();
    setUserInputCaptcha('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          captchaId,
          captchaText: userInputCaptcha
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || '登入失敗');
      } else {
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
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
      <form 
        onSubmit={handleLogin} 
        noValidate 
        style={{ 
          textAlign: 'center', 
          border: '2px solid orange', 
          padding: '20px', 
          borderRadius: '8px'
        }}
      >
        <h2>Login</h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
        </div>

        {/* 顯示後端給的文字 captcha */}
        <div style={{ marginBottom: '1rem' }}>
          <label>驗證碼 (請輸入下列文字):</label><br/>
          <div style={{ fontWeight: 'bold', margin: '5px 0' }}>
            {captchaText || '...'}
          </div>
          <input
            type="text"
            placeholder="輸入上方驗證文字"
            value={userInputCaptcha}
            onChange={(e) => setUserInputCaptcha(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
          <button 
            type="button"
            onClick={handleRefreshCaptcha}
            style={{ marginTop: '5px', cursor: 'pointer' }}
          >
            刷新驗證碼
          </button>
        </div>

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
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
