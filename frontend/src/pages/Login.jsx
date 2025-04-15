import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // 清空先前的錯誤

    if (!userName || !password) {
      setError('請輸入使用者名稱和密碼');
      return;
    }

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, password })
      });
      if (res.ok) {
        // 登入成功，取得回傳的 token
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        // 可在此設定全域登入狀態（例如透過 context），這裡簡化略過
        navigate('/');  // 導向首頁
      } else {
        // 登入失敗
        const data = await res.json();
        setError(data.message || '登入失敗，帳號或密碼錯誤');
      }
    } catch (err) {
      console.error('Network error during login:', err);
      setError('網路錯誤，請稍後再試');
    }
  };

  return (
    <div className="login-page">
      <h2>會員登入</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label>使用者名稱：
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
              required 
            />
          </label>
        </div>
        <div>
          <label>密碼：
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </label>
        </div>
        <button type="submit">登入</button>
      </form>
    </div>
  );
}

export default Login;
