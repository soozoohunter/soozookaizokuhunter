// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';

// Email regex 同樣可共用
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  function isEmailFormat(str) {
    return EMAIL_REGEX.test(str);
  }

  const handleRegister = async () => {
    // 1) 前端檢查
    if (!email || !password) {
      alert('請輸入 Email 與 密碼');
      return;
    }
    if (!isEmailFormat(email)) {
      alert('Email 格式不正確');
      return;
    }
    if (password !== confirm) {
      alert('密碼與確認密碼不符');
      return;
    }

    try {
      // 2) 呼叫後端 /api/auth/register
      const res = await axios.post('/api/auth/register', { email, password });
      alert('註冊成功：' + (res.data?.message || 'OK'));
      // TODO: 註冊成功可跳轉 /login
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.error || '註冊失敗');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>註冊</h2>

      <label style={styles.label}>Email:</label>
      <input
        type="text"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={styles.input}
      />

      <label style={styles.label}>密碼:</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={styles.input}
      />

      <label style={styles.label}>確認密碼:</label>
      <input
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleRegister} style={styles.button}>送出</button>
    </div>
  );
}

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
    marginBottom: '1rem',
    color: '#fff'
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

export default RegisterPage;
