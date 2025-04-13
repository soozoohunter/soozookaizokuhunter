import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('請輸入帳號和密碼');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || '登入失敗，請檢查帳號與密碼');
      } else {
        // 登入成功，可將 JWT 保存並導向首頁或會員專區
        localStorage.setItem('authToken', result.token);
        alert('登入成功');
        navigate('/'); // 導向首頁或其他登入後頁面
      }
    } catch (err) {
      setError('伺服器發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <label>Email：</label>
      <input 
        type="text" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
      />
      <label>Password：</label>
      <input 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
      />
      {error && <div className="error-message">{error}</div>}
      <button onClick={handleLogin} disabled={loading}>
        {loading ? '登入中...' : '登入'}
      </button>
    </div>
  );
}

export default LoginPage;
