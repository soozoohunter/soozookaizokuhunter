import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('shortVideo');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      let res = await axios.post('/api/auth/signup', { email, password, role });
      alert('註冊成功');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || '註冊失敗');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>用戶註冊</h2>
      <div>
        <input
          placeholder="輸入Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div>
        <input
          placeholder="輸入密碼"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <div>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="shortVideo">shortVideo</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <button onClick={handleRegister}>註冊</button>
    </div>
  );
}

export default RegisterPage;
