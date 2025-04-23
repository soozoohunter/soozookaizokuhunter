/***************************************************************
 * frontend/src/pages/AdminLogin.jsx
 * - 簡易管理員登入頁面
 ***************************************************************/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [email, setEmail] = useState('zacyao1005');    // 預設填入您的Admin帳號
  const [password, setPassword] = useState('Zack967988'); // 預設填入您的Admin密碼
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      // 若已有token，直接進入
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        navigate('/admin/dashboard');
      } else {
        setError('登入失敗: 帳號或密碼不正確');
      }
    } catch (err) {
      console.error('[AdminLogin] error:', err);
      setError('登入發生錯誤，請稍後再試');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '80px', color: '#fff' }}>
      <h2 className="mb-4">管理員登入</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label className="form-label">Email (Admin)</label>
          <input
            type="text"
            className="form-control"
            style={{ marginBottom: '1rem' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email或帳號"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">密碼</label>
          <input
            type="password"
            className="form-control"
            style={{ marginBottom: '1rem' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入密碼"
            required
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <button type="submit" className="btn btn-primary w-100">登入</button>
      </form>
    </div>
  );
}

export default AdminLogin;
