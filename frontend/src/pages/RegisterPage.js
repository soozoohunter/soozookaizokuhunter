// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [role, setRole] = useState('shortVideo');
  const navigate = useNavigate();

  const handleRegister = async () => {
    // 1) 簡單前端檢查「確認密碼是否一致」
    if (password !== confirmPwd) {
      alert('兩次密碼不一致，請重新輸入！');
      return;
    }
    try {
      // 2) 發送註冊API
      //    此處若後端對應 '/api/auth/register' 且需 {email, password, userType, ...}
      const body = {
        email,
        password,
        userType: role,
        // 如果後端也要 username，可自行加 username 欄位
        username: '' // 或您可把 email 當作 username
      };
      let res = await axios.post('/api/auth/register', body);
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
        <label>輸入 Email：</label><br />
        <input
          type="email"
          placeholder="請輸入Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width:'250px', marginBottom:'8px' }}
        />
      </div>
      <div>
        <label>輸入密碼：</label><br />
        <input
          type="password"
          placeholder="請輸入密碼"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width:'250px', marginBottom:'8px' }}
        />
      </div>
      <div>
        <label>確認密碼：</label><br />
        <input
          type="password"
          placeholder="再次輸入密碼"
          value={confirmPwd}
          onChange={e => setConfirmPwd(e.target.value)}
          style={{ width:'250px', marginBottom:'8px' }}
        />
      </div>
      <div>
        <label>選擇角色：</label><br />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{ width:'260px', marginBottom:'8px' }}
        >
          <option value="shortVideo">短影音的創作人</option>
          <option value="ecommerce">電商網拍個人賣家</option>
        </select>
        <p style={{ fontSize:'0.85rem', color:'#aaa' }}>
          「短影音的創作人」可上傳影片檔案；<br/>
          「電商網拍個人賣家」則上傳商品照片。
        </p>
      </div>
      <button onClick={handleRegister}>註冊</button>
    </div>
  );
}

export default RegisterPage;
