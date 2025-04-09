// frontend/src/pages/Login.js
import React, { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 自訂 email 驗證 (regex)
  function validateEmail(value) {
    // 此正則僅示範，若有其他更完整的可替換
    const re = /^\S+@\S+\.\S+$/;
    return re.test(value);
  }

  async function doLogin() {
    // 1) 前端檢查
    if (!email || !password) {
      alert('請輸入「Email」與「密碼」');
      return;
    }
    if (!validateEmail(email)) {
      alert('Email 格式不正確，請再試一次');
      return;
    }

    try {
      // 2) 呼叫後端: POST /api/auth/login
      //    ※ 後端請確保路徑 /api/auth/login 是正確的
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // 3) 解析後端回傳
      const data = await resp.json();

      // 4) 若後端回傳非 2xx，就把 data.error 顯示
      if (!resp.ok) {
        // 後端例如：
        //    404 => { error:'使用者不存在' }
        //    401 => { error:'密碼錯誤' }
        //    500 => { error:'系統錯誤' }
        alert('登入錯誤：' + (data.error || '未知錯誤'));
        return;
      }

      // 5) 登入成功
      alert('登入成功，Token=' + data.token);

      // 將 token 存在 localStorage
      localStorage.setItem('token', data.token);

      // ★ 登入後導向「Dashboard」或其他頁面
      window.location.href = '/dashboard';
    } catch (err) {
      // fetch 或網路層面的錯誤
      alert('登入發生錯誤：' + err.message);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>登入</h2>

      <div style={styles.formGroup}>
        <label style={styles.label}>Email</label>
        <input
          type="text"                    // ← 用 text，避免瀏覽器原生 "pattern mismatch"
          placeholder="請輸入您的 Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>密碼</label>
        <input
          type="password"
          placeholder="••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={styles.input}
        />
      </div>

      <button onClick={doLogin} style={styles.button}>
        登入
      </button>
    </div>
  );
}

// -- 簡易美化 --
const styles = {
  container: {
    maxWidth: '400px',
    margin: '80px auto',
    padding: '20px',
    background: 'rgba(0,0,0,0.7)',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#fff'
  },
  title: {
    marginBottom: '1rem',
    fontSize: '1.5rem',
    color: '#ff1c1c'
  },
  formGroup: {
    marginBottom: '1rem',
    textAlign: 'left'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    color: '#ff1c1c'
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #666'
  },
  button: {
    backgroundColor: '#ff1c1c',
    color: '#fff',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default Login;
