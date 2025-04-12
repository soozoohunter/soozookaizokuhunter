// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const nav = useNavigate();

  // 提交登入
  const doLogin = async(e)=>{
    e.preventDefault(); // 阻止表單重新整理
    setErrMsg('');

    if(!email || !password){
      setErrMsg('請輸入 Email 與密碼');
      return;
    }
    try {
      const resp = await fetch('/auth/login',{
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();

      if(resp.ok){
        // 登入成功
        localStorage.setItem('token', data.token || '');
        alert('登入成功');
        nav('/membership'); 
      } else {
        setErrMsg(data.error || '登入失敗');
      }
    } catch(e){
      setErrMsg('發生錯誤: '+ e.message);
    }
  };

  // 讓表單置中 + 橘色邊框的簡易樣式
  const containerStyle = {
    maxWidth: '400px',
    margin: '2rem auto',       // 置中: auto
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#111',
    color: '#fff',
    fontFamily: 'sans-serif'
  };

  const labelStyle = { display:'block', marginBottom:'0.3rem' };
  const inputStyle = {
    width:'100%',
    padding:'0.5rem',
    marginBottom:'1rem',
    border:'1px solid #555',
    borderRadius:'4px',
    background:'#222',
    color:'#fff'
  };
  const buttonStyle = {
    background:'orange',
    color:'#000',
    border:'none',
    borderRadius:'4px',
    padding:'0.5rem 1rem',
    cursor:'pointer',
    fontWeight:'bold'
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign:'center', color:'red', marginBottom:'1rem' }}>Login</h2>
      <form onSubmit={doLogin}>
        <label style={labelStyle}>Email:</label>
        <input 
          type="email"
          style={inputStyle}
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />

        <label style={labelStyle}>Password:</label>
        <input 
          type="password"
          style={inputStyle}
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />

        <div style={{ textAlign:'center', marginTop:'1rem' }}>
          <button type="submit" style={buttonStyle}>Log In</button>
        </div>
      </form>

      {errMsg && <p style={{ color:'red', marginTop:'1rem' }}>{errMsg}</p>}
    </div>
  );
}
