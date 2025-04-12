// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [msg, setMsg] = useState('');
  const nav = useNavigate();

  const doRegister = async()=>{
    setMsg('');
    if(!email || !password || !userName){
      setMsg('請輸入完整註冊資訊');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('userName', userName);

      const resp = await fetch('/auth/register',{
        method:'POST',
        body: formData
      });
      const data = await resp.json();
      if(resp.ok){
        setMsg('註冊成功，請至信箱查看驗證碼後前往 [驗證頁] 輸入');
        // 前往驗證頁
        setTimeout(()=>{
          nav('/verify-email');
        }, 1500);
      } else {
        setMsg('註冊失敗: '+ data.error);
      }
    } catch(e){
      setMsg('發生錯誤: '+ e.message);
    }
  };

  return (
    <div>
      <h2>註冊</h2>
      <div>
        <label>Email: </label>
        <input 
          type="email"
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
        />
      </div>
      <div>
        <label>密碼: </label>
        <input 
          type="password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)}
        />
      </div>
      <div>
        <label>暱稱: </label>
        <input 
          value={userName} 
          onChange={e=>setUserName(e.target.value)} 
        />
      </div>
      <button onClick={doRegister}>送出註冊</button>

      {msg && <p style={{ color:'yellow', marginTop:'1rem' }}>{msg}</p>}
    </div>
  );
}
