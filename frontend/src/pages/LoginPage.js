import React, { useState } from 'react';

export default function LoginPage({ history }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async(e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if(res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        alert('登入成功');
        history.push('/upload');
      } else {
        alert(`登入失敗: ${data.error || '未知錯誤'}`);
      }
    } catch(err) {
      alert(`發生錯誤: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2>登入</h2>
      <form onSubmit={handleLogin} style={styles.form}>
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
        <button type="submit" style={styles.button}>登入</button>
      </form>
      <div style={{marginTop:10}}>
        <a href="/register" style={styles.link}>前往註冊</a>
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
