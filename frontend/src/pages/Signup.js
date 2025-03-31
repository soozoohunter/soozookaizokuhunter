import React, { useState } from 'react';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('shortVideo');

  const doSignup = async () => {
    try {
      const resp = await fetch('/api/signup', {
        method: 'POST',
        headers:{ 'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password, role })
      });
      const data = await resp.json();
      if(resp.ok){
        alert('註冊成功: userId='+ data.userId + ', role=' + data.role);
      } else {
        alert('註冊失敗: '+ data.error);
      }
    } catch(e){
      console.error(e);
      alert('註冊錯誤');
    }
  };

  return (
    <div style={{ margin:'2rem' }}>
      <h2>註冊</h2>
      <label>Email: </label>
      <input value={email} onChange={e=>setEmail(e.target.value)} /><br/><br/>
      <label>Password: </label>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} /><br/><br/>
      <label>角色: </label>
      <select value={role} onChange={e=>setRole(e.target.value)}>
        <option value="shortVideo">短影音網紅</option>
        <option value="ecommerce">電商賣家</option>
      </select>
      <br/><br/>
      <button onClick={doSignup}>註冊</button>
    </div>
  );
}

export default Signup;
