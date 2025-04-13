import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterEmail() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    setError('');
    if (!email) {
      setError('請輸入電子郵件地址');
      return;
    }
    // 簡單驗證 email 格式
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Email 格式不正確');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/auth/sendCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || '驗證碼傳送失敗，請稍後再試');
      } else {
        // 驗證碼已發送，進入下一步（輸入驗證碼）
        navigate('/register/verify', { state: { email } });
      }
    } catch (err) {
      setError('伺服器發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>會員註冊</h2>
      <label>電子郵件 (必填)：</label>
      <input 
        type="text" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
      />
      {error && <div className="error-message">{error}</div>}
      <button onClick={handleSendCode} disabled={loading}>
        {loading ? '寄送中...' : '寄送驗證碼'}
      </button>
    </div>
  );
}

export default RegisterEmail;
