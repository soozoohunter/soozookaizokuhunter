import React, { useState } from 'react';

export default function RegisterPage({ history }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('shortVideo');

  const handleRegister = async(e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if(res.ok) {
        alert('註冊成功，請登入');
        history.push('/login');
      } else {
        alert(`註冊失敗: ${data.error || '未知錯誤'}`);
      }
    } catch(err) {
      alert(`發生錯誤: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2>註冊</h2>
      <form onSubmit={handleRegister} style={styles.form}>
        <div style={styles.formGroup}>
          <label>信箱：</label>
          <input 
            type="email" 
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>密碼：</label>
          <input 
            type="password" 
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>身分：</label>
          <select 
            value={role}
            onChange={e=>setRole(e.target.value)}
            style={styles.input}
          >
            <option value="shortVideo">網紅(短影音)</option>
            <option value="ecommerce">電商(商品圖+短影音)</option>
          </select>
        </div>
        <button type="submit" style={styles.button}>註冊</button>
      </form>
      <div style={{marginTop:10}}>
        <a href="/login" style={styles.link}>已有帳號？前往登入</a>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px', margin:'80px auto', padding:'20px',
    border:'1px solid #ccc', borderRadius:'8px',
    textAlign:'center'
  },
  form: {
    display:'flex', flexDirection:'column'
  },
  formGroup: {
    marginBottom:'10px', textAlign:'left'
  },
  input: {
    width:'100%', padding:'8px', marginTop:'5px'
  },
  button: {
    padding:'10px 20px', cursor:'pointer'
  },
  link:{
    textDecoration:'none', color:'#007bff'
  }
};
