// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      alert('請輸入Email與密碼');
      return;
    }
    if (password !== confirm) {
      alert('密碼與確認密碼不符');
      return;
    }

    try {
      const res = await axios.post('/api/auth/register', { email, password });
      alert('註冊成功：' + (res.data?.message || 'OK'));

      // 可直接跳轉頁面:
      // window.location.href = '/login';

    } catch (err) {
      alert(err.response?.data?.error || '註冊失敗');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>註冊</h2>
      <label>Email: </label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display:'block', margin:'0 0 8px' }}
      />

      <label>密碼: </label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display:'block', margin:'0 0 8px' }}
      />

      <label>確認密碼: </label>
      <input
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        style={{ display:'block', margin:'0 0 16px' }}
      />

      <button onClick={handleRegister}>送出</button>
    </div>
  );
}

export default RegisterPage;
