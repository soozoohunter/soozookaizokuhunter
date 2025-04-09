// frontend/src/pages/Login.js
import React, { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const doLogin = async() => {
    if(!email || !password) {
      alert('請輸入Email與密碼');
      return;
    }
    try {
      // 呼叫 /api/auth/login
      const resp = await fetch('/api/auth/login', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();

      if (!resp.ok) {
        // 例如 404 => { error:'使用者不存在' }
        // 401 => { error:'密碼錯誤' }
        // 500 => ...
        alert('登入錯誤: ' + (data.error || '未知錯誤'));
        return;
      }

      alert('登入成功, token=' + data.token);
      localStorage.setItem('token', data.token);
      // 跳轉或 setState
    } catch(e) {
      alert('登入發生錯誤: ' + e.message);
    }
  };

  return (
    <div style={{ margin:'2rem' }}>
      <h2>登入</h2>
      <label>Email: </label>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display:'block', marginBottom:'8px' }}
      />
      <label>Password: </label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display:'block', marginBottom:'8px' }}
      />
      <button onClick={doLogin}>登入</button>
    </div>
  );
}

export default Login;
