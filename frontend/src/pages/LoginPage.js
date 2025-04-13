// frontend/src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [userPlan, setUserPlan] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/membership', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(d => {
        if (d.plan) setUserPlan(d.plan);
      })
      .catch(e => console.error('membership fetch error:', e));
  }, []);

  const doLogin = async () => {
    setErrMsg('');
    if (!email || !password) {
      setErrMsg('請輸入 Email 和 密碼');
      return;
    }
    try {
      const resp = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if (resp.ok) {
        localStorage.setItem('token', data.token);
        alert('登入成功!');
        nav('/membership');
      } else {
        setErrMsg(data.error || '登入失敗');
      }
    } catch (e) {
      setErrMsg('發生錯誤: ' + e.message);
    }
  };

  const containerStyle = {
    margin: '2rem auto',
    border: '2px solid orange',
    borderRadius: '8px',
    padding: '1.5rem',
    maxWidth: '380px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.05)'
  };
  const titleStyle = {
    color: 'red',
    marginBottom: '1rem',
    fontSize: '1.5rem'
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Login</h2>

      {userPlan && (
        <p style={{ color: 'orange', marginBottom: '1rem' }}>
          目前方案：{userPlan}
        </p>
      )}

      <div style={{ textAlign: 'left' }}>
        <label style={{ display:'block', color:'#fff', marginBottom:'4px' }}>Email：</label>
        <input
          style={{ width:'100%', padding:'0.5rem', marginBottom:'1rem' }}
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="輸入 Email"
        />

        <label style={{ display:'block', color:'#fff', marginBottom:'4px' }}>Password：</label>
        <input
          style={{ width:'100%', padding:'0.5rem', marginBottom:'1rem' }}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="輸入密碼"
        />
      </div>

      {errMsg && (
        <p style={{ color: 'yellow', marginBottom: '0.5rem' }}>{errMsg}</p>
      )}

      <button
        onClick={doLogin}
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1.2rem',
          border: '2px solid orange',
          background: 'black',
          color: 'orange',
          cursor: 'pointer',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}
      >
        Log In
      </button>
    </div>
  );
}
