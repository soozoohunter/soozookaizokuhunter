import React, { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const doLogin = async () => {
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if(resp.ok) {
        setMsg(`登入成功, role=${data.role}`);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
      } else {
        setMsg(`登入失敗: ${data.error}`);
      }
    } catch(e) {
      console.error(e);
      setMsg('登入發生錯誤');
    }
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h2>登入</h2>
      <label>Email：</label><br/>
      <input value={email} onChange={e=>setEmail(e.target.value)} /><br/><br/>
      <label>密碼：</label><br/>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} /><br/><br/>
      <button onClick={doLogin}>登入</button>
      <p>{msg}</p>
    </div>
  );
}

export default Login;
