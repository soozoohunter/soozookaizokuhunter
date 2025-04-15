// frontend/src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 提交表單
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 準備要送給後端的資料 (userName + password)
      const body = { userName, password };
      // 發送 POST /auth/login (或 /auth/loginByUserName，看後端配置)
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || '登入失敗 (Login Failed)');
      } else {
        // 成功登入，儲存 Token
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        alert('登入成功 (Login Success)');
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('發生錯誤，請稍後再試 (An error occurred, please try again later)');
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={styles.title}>會員登入 / Member Login</h2>

        {/* UserName */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            用戶名稱 (Username):
          </label>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            required
            style={styles.input}
            placeholder="請輸入用戶名稱 / Enter your username"
          />
        </div>

        {/* Password */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            密碼 (Password):
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="請輸入密碼 / Enter your password"
          />
        </div>

        {/* Error Message */}
        {error && <p style={styles.errorMsg}>{error}</p>}

        {/* Submit Button */}
        <button type="submit" style={styles.submitBtn}>
          登入 / Login
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '85vh',
    backgroundColor: '#000'
  },
  form: {
    border: '2px solid orange',
    borderRadius: '10px',
    padding: '2rem',
    textAlign: 'center',
    maxWidth: '360px',
    width: '100%',
    backgroundColor: 'rgba(255,140,0,0.1)'
  },
  title: {
    color: 'orange',
    marginBottom: '1.5rem',
    fontSize: '1.5rem'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#FFD700', // 黃金色, 與橘色有區別
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '0.6rem',
    border: '1px solid #ccc',
    borderRadius: '4px'
  },
  errorMsg: {
    color: 'red',
    marginTop: '0.5rem',
    marginBottom: '1rem'
  },
  submitBtn: {
    backgroundColor: 'orange',
    color: '#000',
    padding: '0.6rem 1rem',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%'
  }
};
