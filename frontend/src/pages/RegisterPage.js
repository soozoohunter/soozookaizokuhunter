// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleRegister = async () => {
    // 1) 基本欄位檢查
    if (!email || !password) {
      alert('請輸入Email與密碼');
      return;
    }
    if (password !== confirm) {
      alert('密碼與確認密碼不符');
      return;
    }

    try {
      // 2) 呼叫後端 /api/auth/register
      //    => 後端請參考 routes/auth.js 裡的 router.post('/register', ...)
      const res = await axios.post('/api/auth/register', {
        email,
        password
      });

      // 3) 若成功
      alert('註冊成功：' + (res.data?.message || 'OK'));
      // 你也可在這裡導向到 /login 或清空欄位
      // e.g. window.location.href = '/login';

    } catch (err) {
      // 4) 若發生錯誤，顯示後端回傳的 error
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
