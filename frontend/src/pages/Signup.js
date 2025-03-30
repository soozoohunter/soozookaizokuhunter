import React, { useState } from 'react';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ecommerce');  // 預設網路商家
  const [msg, setMsg] = useState('');

  const doSignup = async () => {
    try {
      const resp = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await resp.json();
      if(resp.ok) {
        setMsg(`註冊成功, userId=${data.userId}`);
      } else {
        setMsg(`註冊失敗: ${data.error}`);
      }
    } catch(e) {
      console.error(e);
      setMsg('註冊發生錯誤');
    }
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h2>註冊 (網路商家 / 短影音網紅)</h2>
      <label>Email：</label><br/>
      <input value={email} onChange={e=>setEmail(e.target.value)} /><br/><br/>
      <label>密碼：</label><br/>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} /><br/><br/>
      <label>選擇角色：</label><br/>
      <select value={role} onChange={e=>setRole(e.target.value)}>
        <option value="ecommerce">網路商家 (商品照片最多30張)</option>
        <option value="shortVideo">短影音網紅 (影片最多5部)</option>
      </select>
      <br/><br/>
      <button onClick={doSignup}>註冊</button>
      <p>{msg}</p>
    </div>
  );
}

export default Signup;
