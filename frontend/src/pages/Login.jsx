// frontend/src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 發送 userName + password 至後端
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || '登入失敗 (Login Failed)');
      } else {
        // 成功登入
        if (data.token) localStorage.setItem('token', data.token);
        alert('登入成功 (Login Success)');
        navigate('/');
      }
    } catch (err) {
      console.error('[Login Error]', err);
      setError('發生錯誤，請稍後再試 / An error occurred, please try again.');
    }
  };

  return (
    <div style={styles.container}>
      {/* 包一層 wrapper 以實現置中 + 橘色框 */}
      <div style={styles.formWrapper}>
        <h2 style={styles.title}>會員登入 / Member Login</h2>

        {/* 錯誤訊息 */}
        {error && <p style={styles.errorMsg}>{error}</p>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>用戶名稱 (Username):</label>
            <input
              type="text"
              style={styles.input}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="請輸入用戶名稱 / Enter username"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>密碼 (Password):</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼 / Enter password"
              required
            />
          </div>

          <button type="submit" style={styles.submitBtn}>
            登入 / Login
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    // 使容器充滿螢幕高度，以便垂直置中
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    minHeight: '100vh',
    margin: 0,
    padding: 0
  },
  formWrapper: {
    border: '2px solid orange',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,140,0,0.1)',
    width: '350px',
    padding: '1.5rem',
    textAlign: 'center'
  },
  title: {
    color: 'orange',
    marginBottom: '1rem',
    fontSize: '1.6rem'
  },
  errorMsg: {
    color: 'red',
    marginBottom: '1rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroup: {
    marginBottom: '1rem',
    textAlign: 'left'
  },
  label: {
    color: '#FFD700',
    marginBottom: '0.3rem',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  submitBtn: {
    marginTop: '1rem',
    backgroundColor: 'orange',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    padding: '0.6rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
