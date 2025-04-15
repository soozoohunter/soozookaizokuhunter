import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!userName || !password) {
      setError('請輸入使用者名稱和密碼');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        navigate('/');
      } else {
        const data = await res.json();
        setError(data.message || '登入失敗，帳號或密碼錯誤');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={styles.container}>
      <h2 style={styles.title}>會員登入</h2>
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="text"
          placeholder="使用者名稱"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? '登入中...' : '登入'}
        </button>
        <div style={styles.linkContainer}>
          還沒有帳號？<Link to="/register" style={styles.link}>立即註冊</Link>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', backgroundColor: '#000', color: '#FFD700', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
  },
  title: {
    color: '#F8E114', marginBottom: '20px', fontSize: '2em', fontWeight: 'bold'
  },
  form: {
    width: '90%', maxWidth: '400px', padding: '20px', border: '1px solid #FFA500', borderRadius: '8px', boxShadow: '0 0 8px rgba(255,165,0,0.5)', backgroundColor: '#000'
  },
  input: {
    backgroundColor: '#000', border: '1px solid #FFA500', borderRadius: '4px', color: '#FFD700', padding: '10px', marginBottom: '10px', width: '100%', boxSizing: 'border-box', boxShadow: 'inset 0 0 5px rgba(255,165,0,0.5)'
  },
  button: {
    backgroundColor: '#000', border: '1px solid #FFA500', borderRadius: '4px', color: '#F8E114', padding: '10px', width: '100%', fontWeight: 'bold', cursor: 'pointer'
  },
  linkContainer: { marginTop: '15px', textAlign: 'center' },
  link: { color: '#F8E114', textDecoration: 'none' },
  error: { color: 'red', marginBottom: '15px', textAlign: 'center' }
};

export default Login;
