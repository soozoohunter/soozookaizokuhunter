// src/pages/VerifyEmailPage.js
import React, { useState } from 'react';

export default function VerifyEmailPage(){
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  const doVerify = async()=>{
    setMsg('');
    if(!email || !code){
      setMsg('請輸入 email 與 驗證碼');
      return;
    }
    try {
      const resp = await fetch('/auth/verifyEmail',{
        method:'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await resp.json();
      if(resp.ok){
        setMsg('驗證成功，請去登入頁登入');
      } else {
        setMsg('驗證失敗: '+ data.error);
      }
    } catch(e){
      setMsg('發生錯誤:'+ e.message);
    }
  };

  return (
    <div>
      <h2>輸入 Email 驗證碼</h2>
      <div>
        <label>Email: </label>
        <input 
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
      </div>
      <div>
        <label>驗證碼: </label>
        <input 
          type="text"
          value={code}
          onChange={e=>setCode(e.target.value)}
        />
      </div>
      <button onClick={doVerify}>送出驗證</button>
      {msg && <p style={{ marginTop:'1rem', color:'yellow' }}>{msg}</p>}
    </div>
  );
}
