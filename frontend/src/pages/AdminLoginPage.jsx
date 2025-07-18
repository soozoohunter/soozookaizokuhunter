// frontend/src/pages/AdminLoginPage.jsx (最終版)
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import apiClient from '../services/apiClient';
import styled from 'styled-components';

const styles = {
  container: {
    backgroundColor: '#0a0f17',
    color: '#f5faff',
    minHeight: 'calc(100vh - 140px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  loginBox: {
    backgroundColor: '#1e1e1e',
    border: '2px solid #ff6f00',
    borderRadius: '8px',
    padding: '2rem 2.5rem',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.6rem',
    marginBottom: '1rem',
    color: '#FFD700',
  },
  errorMsg: {
    color: '#F87171',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  label: {
    margin: '0.5rem 0 0.25rem',
    fontSize: '0.9rem',
    color: '#ffa500',
  },
  input: {
    padding: '0.75rem',
    marginBottom: '1rem',
    fontSize: '1rem',
    backgroundColor: '#2c2c2c',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#fff',
  },
  loginBtn: {
    backgroundColor: '#f97316',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '1rem',
    padding: '0.75rem 1.2rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};


export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password.trim()) {
      setError('請輸入帳號與密碼');
      return;
    }

    try {
      const response = await apiClient.post('/admin/login', {
        identifier: identifier.trim(),
        password,
      });
      login(response.data.token);
      alert(response.data.message || 'Admin 登入成功');
    } catch (err) {
      const message = err.response?.data?.message || '登入失敗，請檢查帳號密碼或權限。';
      setError(message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h2 style={styles.title}>Admin Login 管理員登入</h2>
        {error && <p style={styles.errorMsg}>{error}</p>}
        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>帳號 (手機號碼 或 Email)</label>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. admin@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <label style={styles.label}>密碼 / Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" style={styles.loginBtn}>
            登入 / Login
          </button>
        </form>
      </div>
    </div>
  );
}
