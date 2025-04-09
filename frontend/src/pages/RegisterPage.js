// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  async function handleRegister() {
    // 1) 檢查欄位
    if (!email || !password) {
      alert('請輸入 Email 與密碼');
      return;
    }
    if (password !== confirm) {
      alert('密碼與確認密碼不符');
      return;
    }

    try {
      // 2) 呼叫 /api/auth/register (後端已改好)
      const res = await axios.post('/api/auth/register', { email, password });
      // 3) 成功
      alert(res.data.message || '註冊成功');
      // TODO: 您想導回登入，可:
      // window.location.href = '/login';

    } catch (err) {
      // 4) 若發生錯誤
      alert(err.response?.data?.error || '註冊失敗');
    }
  }

  // 置中 + 簡單美化
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>註冊</h2>

      <div style={styles.formGroup}>
        <label style={styles.label}>Email</label>
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={styles.input}
          placeholder="請輸入您的 Email"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>密碼</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={styles.input}
          placeholder="••••••"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>確認密碼</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          style={styles.input}
          placeholder="再輸入一次密碼"
        />
      </div>

      <button onClick={handleRegister} style={styles.button}>
        送出
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '80px auto',
    padding: '20px',
    background: 'rgba(0,0,0,0.7)',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#fff',
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

export default RegisterPage;
