import React, { useState } from 'react';

export default function LoginPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async(e)=>{
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if(res.ok){
        alert('登入成功');
        localStorage.setItem('token', data.token);
        window.location.href = '/';
      } else {
        alert(data.error || '登入失敗');
      }
    } catch(err){
      alert('發生錯誤：' + err.message);
    }
  };

  return (
    <div style={{ maxWidth:'400px', margin:'40px auto', color:'#fff' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1rem' }}>登入</h2>
      <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column' }}>
        <label style={labelStyle}>
          Email
          <input 
            type="text"
            placeholder="請輸入Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          密碼
          <input 
            type="password"
            placeholder="請輸入密碼"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>
        <button type="submit" style={btnStyle}>登入</button>
      </form>
      <div style={{ textAlign:'center', marginTop:'12px' }}>
        <button 
          onClick={()=>window.location.href='/register'} 
          style={btnStyle}
        >
          前往註冊
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  marginBottom:'10px'
};
const inputStyle = {
  width:'100%',
  padding:'6px',
  marginTop:'4px',
  borderRadius:'4px',
  border:'1px solid #666'
};
const btnStyle = {
  marginTop:'12px',
  padding:'10px',
  backgroundColor:'orange',
  border:'none',
  borderRadius:'4px',
  color:'#fff',
  cursor:'pointer'
};
