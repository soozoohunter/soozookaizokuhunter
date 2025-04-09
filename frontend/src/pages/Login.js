// frontend/src/pages/Login.js
import React, { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const doLogin = async () => {
    try {
      // 1) 呼叫 /api/auth/login
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();

      if (!resp.ok) {
        // resp 不 OK => 顯示 data.error
        alert('登入錯誤: ' + (data.error || 'Unknown'));
        return;
      }
      // resp.ok => 登入成功
      alert('登入成功, token=' + data.token);
      localStorage.setItem('token', data.token);
      // 不需要 role => 移除 role
      // localStorage.setItem('role', data.role || '');
    } catch (e) {
      console.error(e);
      alert('登入錯誤: ' + e.message);
    }
  };

  return (
    <div style={{ margin:'2rem'}}>
      <h2>登入</h2>
      <label>Email: </label>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display:'block', marginBottom:'8px'}}
      />
      <label>Password: </label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display:'block', marginBottom:'8px'}}
      />
      <button onClick={doLogin}>登入</button>
    </div>
  );
}

export default Login;
