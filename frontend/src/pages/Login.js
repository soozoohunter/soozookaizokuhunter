// frontend/src/pages/Login.js
import React, { useState } from 'react';

// 簡易 Email Regex（您也可換更複雜模式）
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 檢查 Email 格式
  function isEmailFormat(str) {
    return EMAIL_REGEX.test(str);
  }

  const doLogin = async() => {
    // 基本檢查
    if (!email || !password) {
      alert('請輸入Email與密碼');
      return;
    }
    if (!isEmailFormat(email)) {
      alert('Email 格式不正確');
      return;
    }

    try {
      // 呼叫後端 /api/auth/login
      const resp = await fetch('/api/auth/login', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();

      if (!resp.ok) {
        alert('登入錯誤: ' + (data.error || '未知錯誤'));
        return;
      }

      // 登入成功
      alert('登入成功, token=' + data.token);
      localStorage.setItem('token', data.token);

      // 跳轉
      window.location.href = '/dashboard';
    } catch(e) {
      alert('登入發生錯誤: ' + e.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>登入</h2>

      <label style={styles.label}>Email:</label>
      <input
        type="text"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={styles.input}
      />

      <label style={styles.label}>Password:</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={styles.input}
      />

      <button onClick={doLogin} style={styles.button}>登入</button>
    </div>
  );
}

// 簡單 CSS
const styles = {
  container: {
    maxWidth: '400px',
    margin: '80px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    textAlign: 'center',
    background: '#222'
  },
  title: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    textAlign: 'left',
    marginTop: '1rem',
    color: '#f88'
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '5px',
    background: '#333',
    color: '#fff',
    border: '1px solid #555'
  },
  button: {
    marginTop: '1.5rem',
    padding: '10px 20px',
    cursor: 'pointer',
    background: '#f00',
    color: '#fff',
    border: 'none',
    borderRadius: '4px'
  }
};

export default Login;
