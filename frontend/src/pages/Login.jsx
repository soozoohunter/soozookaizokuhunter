import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || '登入失敗');
      } else {
        // 登入成功，儲存 Token 並導向主頁
        localStorage.setItem('token', data.token);
        alert('登入成功');
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('發生錯誤，請稍後再試');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
      <form onSubmit={handleLogin} noValidate style={{ textAlign: 'center' }}>
        <h2>Login</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        <button 
          type="submit" 
          style={{ padding: '0.5rem 1rem', backgroundColor: 'orange', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
