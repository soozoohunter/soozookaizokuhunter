import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async () => {
    try {
      setError('');
      const res = await fetch('/auth/sendCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        // 顯示後端回傳的錯誤訊息
        setError(data.message || '無法寄送驗證碼');
      } else {
        // 驗證碼發送成功，進入下一步
        setStep(2);
      }
    } catch (err) {
      console.error('SendCode error:', err);
      setError('發生錯誤，請稍後再試');
    }
  };

  const handleCheckCode = async () => {
    try {
      setError('');
      const res = await fetch('/auth/checkCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || '驗證碼錯誤');
      } else {
        // 驗證碼正確，進入設定密碼步驟
        setStep(3);
      }
    } catch (err) {
      console.error('CheckCode error:', err);
      setError('發生錯誤，請稍後再試');
    }
  };

  const handleFinalRegister = async () => {
    try {
      setError('');
      const res = await fetch('/auth/finalRegister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || '註冊失敗');
      } else {
        // 註冊成功，導向登入頁面
        alert('註冊成功，請登入');
        navigate('/login');
      }
    } catch (err) {
      console.error('FinalRegister error:', err);
      setError('發生錯誤，請稍後再試');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      handleSendCode();
    } else if (step === 2) {
      handleCheckCode();
    } else if (step === 3) {
      handleFinalRegister();
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
      <form onSubmit={handleSubmit} noValidate style={{ textAlign: 'center' }}>
        <h2>Register</h2>
        {/* Email Field */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            readOnly={step > 1}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
        </div>
        {/* Verification Code Field (Step 2) */}
        {step >= 2 && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Verification Code:</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
            />
          </div>
        )}
        {/* Password Field (Step 3) */}
        {step === 3 && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
            />
          </div>
        )}
        {/* 錯誤訊息 */}
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        {/* Submit Button */}
        <button 
          type="submit" 
          style={{ padding: '0.5rem 1rem', backgroundColor: 'orange', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          {step === 1 ? 'Send Code' : step === 2 ? 'Verify Code' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default Register;
