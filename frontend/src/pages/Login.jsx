import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userName || !password) {
      setError('請輸入使用者名稱和密碼');
      return;
    }
    try {
      // 呼叫後端 API 進行登入驗證
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, password })
      });
      const result = await response.json();
      if (response.ok) {
        // 登入成功：儲存 JWT，導向首頁或主頁
        localStorage.setItem('token', result.token);
        alert('登入成功');
        navigate('/');  // 返回首頁或導向其他登入後頁面
      } else {
        // 登入失敗：顯示錯誤訊息
        setError(result.error || '登入失敗，請檢查帳號或密碼');
      }
    } catch (err) {
      console.error('Login error', err);
      setError('發生未知錯誤，請稍後再試');
    }
  };

  return (
    <div style={{ padding: '2em' }}>
      <h2>會員登入</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="userName">用戶名稱</label>
        <input 
          id="userName" name="userName" type="text" 
          value={userName} onChange={(e) => setUserName(e.target.value)} 
          placeholder="輸入用戶名稱" required 
        />
        <label htmlFor="password">密碼</label>
        <input 
          id="password" name="password" type="password" 
          value={password} onChange={(e) => setPassword(e.target.value)} 
          placeholder="輸入密碼" required 
        />
        <button type="submit">登入</button>
        {/* 錯誤訊息顯示 */}
        {error && <p className="hint" style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default Login;
