import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async(e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if(res.ok){
        localStorage.setItem('token', data.token);
        setMsg('登入成功');
        setTimeout(()=> navigate('/upload'), 500);
      } else {
        setMsg(data.message || '登入失敗');
      }
    } catch(err){
      console.error(err);
      setMsg('發生錯誤');
    }
  };

  return (
    <div style={{padding:'2em'}}>
      <h3>用戶登入</h3>
      {msg && <p style={{color:'red'}}>{msg}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>帳號:</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <div>
          <label>密碼:</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button type="submit">登入</button>
      </form>
      <p>尚未註冊？ <a href="/register">點此</a></p>
    </div>
  );
}
