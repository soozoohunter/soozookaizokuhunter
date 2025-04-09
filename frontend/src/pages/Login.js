// frontend/src/pages/Login.js
import React, { useState } from 'react';

// 简易 regex：大致符合 x@y.z 格式
// 您可根据项目需求更改
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // -------- 1) 简易判定 Email 格式 --------
  function isEmailFormat(str) {
    return EMAIL_REGEX.test(str);
  }

  // -------- 2) 提交登录逻辑 --------
  const doLogin = async () => {
    // (A) 基本前端检查
    if (!email || !password) {
      alert('請輸入 Email 與 密碼');
      return;
    }
    // (B) Email regex 检查
    if (!isEmailFormat(email)) {
      alert('Email 格式不正确');
      return;
    }

    // (C) 发起后端请求
    try {
      // 您后端: POST /api/auth/login
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // 解析后端回传 JSON
      const data = await resp.json();

      // (D) 若后端返回错误
      if (!resp.ok) {
        // e.g. 404 => { error:'使用者不存在' }
        //      401 => { error:'密碼錯誤' }
        //      500 => ...
        alert('登入錯誤: ' + (data.error || '未知錯誤'));
        return;
      }

      // (E) 若成功
      alert('登入成功, token=' + data.token);
      localStorage.setItem('token', data.token);
      // TODO: 如需跳转
      // window.location.href = '/dashboard';

    } catch (e) {
      // (F) 任何网络异常
      alert('登入發生錯誤: ' + e.message);
    }
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h2>登入</h2>

      {/* 将 type="email" 改为 type="text" 避免浏览器阻挡 */}
      <label>Email:</label>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', marginBottom: '8px' }}
      />

      <label>Password:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', marginBottom: '8px' }}
      />

      <button onClick={doLogin}>登入</button>
    </div>
  );
}

export default Login;
