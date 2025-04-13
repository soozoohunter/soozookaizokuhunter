import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const doLogin = async () => {
    setErrMsg('');
    if (!email || !password) {
      setErrMsg('請輸入帳號與密碼');
      return;
    }
    try {
      const resp = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if (resp.ok) {
        localStorage.setItem('token', data.token);
        alert('登入成功');
        nav('/membership');
      } else {
        setErrMsg(data.error || '登入失敗');
      }
    } catch (e) {
      setErrMsg('發生錯誤:' + e.message);
    }
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Login</h2>

      <label style={styles.label}>帳號 (必填)</label>
      <input
        style={styles.input}
        type="text"
        placeholder="輸入您的登入帳號"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="off"
        spellCheck="false"
      />

      <label style={styles.label}>密碼 (必填)</label>
      <input
        style={styles.input}
        type="password"
        placeholder="••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {errMsg && <p style={styles.errMsg}>{errMsg}</p>}

      <button style={styles.btn} onClick={doLogin}>
        登入
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    maxWidth: '400px',
    margin: '2rem auto',
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  title: {
    textAlign: 'center',
    color: 'red',
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    margin: '0.5rem 0',
    color: 'orange'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #555',
    marginBottom: '0.5rem'
  },
  btn: {
    backgroundColor: 'orange',
    color: '#000',
    border: 'none',
    padding: '0.5rem 1.2rem',
    fontWeight: 'bold',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  errMsg: {
    color: 'yellow'
  }
};
