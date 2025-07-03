// frontend/src/pages/AdminLogin.jsx
import React, { useState } from 'react';

export default function AdminLogin() {
  // 預設空值或測試帳號都可
  const [usernameOrEmail, setUsernameOrEmail] = useState('zacyao1005');
  const [password, setPassword] = useState('Zack967988');
  const [error, setError] = useState('');

  // 點擊登入
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // 先清除錯誤

    // 基本檢查：帳號+密碼不可空
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('請輸入帳號與密碼'); 
      return;
    }

    try {
      // 送到後端 /api/admin/login
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 注意：這裡用 username 對應您的 User 模型欄位小寫
          username: usernameOrEmail,
          password
        })
      });

      // 若非 2xx，嘗試解析後端錯誤訊息
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '無法連線，請稍後再試');
      }

      // 成功 => 後端應回傳 token
      const result = await res.json();
      const { token } = result;
      if (!token) {
        throw new Error('登入回傳資訊不完整(缺少 token)');
      }

      // 寫入 localStorage，以後要帶 Token
      localStorage.setItem('token', token);

      // 前往後台首頁（ex: /admin 或 /admin/dashboard）
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message || '登入失敗，請稍後再試');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h2 style={styles.title}>Admin Login 管理員登入</h2>

        {error && (
          <p style={styles.errorMsg}>
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>帳號 (Username 或 Email)</label>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. admin"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
          />

          <label style={styles.label}>密碼 / Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" style={styles.loginBtn}>
            登入 / Login
          </button>
        </form>
      </div>
    </div>
  );
}

/** ========== STYLE ========== */
const styles = {
  container: {
    backgroundColor: '#0a0f17',
    color: '#f5faff',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, sans-serif'
  },
  loginBox: {
    backgroundColor: '#1e1e1e',
    border: '2px solid #ff6f00',
    borderRadius: '8px',
    padding: '2rem 2.5rem',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
    textAlign: 'center'
  },
  title: {
    fontSize: '1.6rem',
    marginBottom: '1rem',
    color: '#FFD700'
  },
  errorMsg: {
    color: 'red',
    marginBottom: '1rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  label: {
    margin: '0.5rem 0 0.25rem',
    fontSize: '0.9rem',
    color: '#ffa500'
  },
  input: {
    padding: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.95rem',
    backgroundColor: '#2c2c2c',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#fff'
  },
  loginBtn: {
    backgroundColor: '#f97316',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '1rem',
    padding: '0.6rem 1.2rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};
