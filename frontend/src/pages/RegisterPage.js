// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (password !== confirmPwd) {
      alert('兩次密碼輸入不一致！');
      return;
    }
    try {
      const body = { email, password };
      const res = await axios.post('/api/auth/register', body);
      alert('註冊成功');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || '註冊失敗');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>註冊</h2>
      <div>
        <label>Email：</label><br/>
        <input
          placeholder="example@test.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ marginBottom:'8px' }}
        />
      </div>
      <div>
        <label>密碼：</label><br/>
        <input
          type="password"
          placeholder="輸入密碼"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ marginBottom:'8px' }}
        />
      </div>
      <div>
        <label>確認密碼：</label><br/>
        <input
          type="password"
          placeholder="再次輸入密碼"
          value={confirmPwd}
          onChange={e => setConfirmPwd(e.target.value)}
          style={{ marginBottom:'8px' }}
        />
      </div>
      <button onClick={handleRegister}>註冊</button>
    </div>
  );
}

export default RegisterPage;
