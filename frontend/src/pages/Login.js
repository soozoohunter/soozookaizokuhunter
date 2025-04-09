// frontend/src/pages/Login.js
import React, { useState } from 'react';

// 簡易 Email Regex（可自由增修或乾脆先不檢查）
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // (A) 前端檢查 Email 格式（可選）
  function isEmailFormat(str) {
    return EMAIL_REGEX.test(str);
  }

  async function handleSubmit(e) {
    e.preventDefault(); // 防止表單預設行為
    // (B) 簡單檢查
    if (!email || !password) {
      alert('請輸入 Email 與 密碼');
      return;
    }
    if (!isEmailFormat(email)) {
      // 若您想後端檢查，也可略過
      alert('Email 格式不正確');
      return;
    }

    try {
      // (C) 向後端 /api/auth/login 發送
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();

      if (!resp.ok) {
        // 後端若回傳 400/401/404/500 等
        alert('登入失敗: ' + (data.error || '未知錯誤'));
        return;
      }

      // (D) 登入成功 -> 記 Token -> 導向 dashboard
      alert(`登入成功！Token = ${data.token}`);
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard'; 
      
    } catch (err) {
      alert('登入發生錯誤: ' + err.message);
    }
  }

  return (
    <div style={styles.outer}>
      <form style={styles.form} noValidate onSubmit={handleSubmit}>
        <h2 style={styles.title}>會員登入</h2>

        <label style={styles.label}>Email</label>
        <input
          type="text" // 不用 type="email" 避免行動瀏覽器自帶 pattern
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>密碼</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>登入</button>
      </form>
    </div>
  );
}

// 一些簡單 CSS in JS
const styles = {
  outer: {
    minHeight: 'calc(100vh - 80px)', 
    // ↑ 若您的 header + banner 佔掉 80px 或更多，這邊可調
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000' // 順應您主題
  },
  form: {
    width: '340px',
    background: '#222',
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 0 8px rgba(0,0,0,0.8)',
  },
  title: {
    color: '#f00',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginTop: '1rem',
    color: '#fff',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    marginTop: '6px',
    padding: '10px',
    background: '#333',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: '4px'
  },
  button: {
    width: '100%',
    marginTop: '1.5rem',
    padding: '10px',
    background: '#f00',
    color: '#fff',
    border: 'none',
    fontSize: '1rem',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};
