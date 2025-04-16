import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async(e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if(res.ok){
        setMsg('註冊成功，請登入');
        setTimeout(()=> navigate('/login'), 800);
      } else {
        setMsg(data.message||'註冊失敗');
      }
    } catch(err){
      console.error(err);
      setMsg('發生錯誤');
    }
  };

  return (
    <div style={{padding:'2em'}}>
      <h3>用戶註冊</h3>
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
        <button type="submit">註冊</button>
      </form>
    </div>
  );
}
