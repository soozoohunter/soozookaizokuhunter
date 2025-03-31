import React, { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const doLogin = async() => {
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if(resp.ok){
        alert('登入成功, token='+data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role || '');
      } else {
        alert('登入失敗: '+ data.error);
      }
    } catch(e){
      console.error(e);
      alert('登入錯誤');
    }
  };

  return (
    <div style={{ margin:'2rem'}}>
      <h2>登入</h2>
      <label>Email: </label>
      <input value={email} onChange={e=>setEmail(e.target.value)} /><br/><br/>
      <label>Password: </label>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} /><br/><br/>
      <button onClick={doLogin}>登入</button>
    </div>
  );
}

export default Login;
