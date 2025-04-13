import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function RegisterVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 600 秒 = 10 分鐘

  useEffect(() => {
    if (!email) {
      // 若無 email，表示流程未按照順序進行，跳回第一步
      navigate('/register/email');
      return;
    }
    // 啟動倒數計時器
    setTimeLeft(600);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleVerifyCode = async () => {
    setError('');
    if (!code) {
      setError('請輸入驗證碼');
      return;
    }
    try {
      const response = await fetch('/auth/checkCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || '驗證碼錯誤或已過期');
        // 若驗證碼過期，導回第一步重新寄送
        if (result.message && result.message.includes('過期')) {
          // 可選：自動導回寄送驗證碼頁面
          // navigate('/register/email', { state: { email } });
        }
      } else {
        // 驗證成功，進入最終註冊步驟
        navigate('/register/final', { state: { email, code } });
      }
    } catch (err) {
      setError('伺服器發生錯誤，請稍後再試');
    }
  };

  const resendCode = async () => {
    // 重新請求驗證碼
    setError('');
    try {
      const response = await fetch('/auth/sendCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        setTimeLeft(600);
        setCode('');
        setError('新的驗證碼已寄出，請檢查您的電子郵件');
      } else {
        const result = await response.json();
        setError(result.message || '驗證碼傳送失敗，請稍後再試');
      }
    } catch (err) {
      setError('伺服器發生錯誤，請稍後再試');
    }
  };

  // 將秒數格式化為 mm:ss
  const formatTime = seconds => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="register-container">
      <h2>驗證電子郵件</h2>
      <p>驗證碼已寄送至您的 Email：<strong>{email}</strong></p>
      <label>驗證碼 (必填)：</label>
      <input 
        type="text" 
        value={code} 
        onChange={e => setCode(e.target.value)} 
      />
      {timeLeft > 0 ? (
        <p>驗證碼有效時間：<strong>{formatTime(timeLeft)}</strong></p>
      ) : (
        <p>驗證碼已失效，請重新請求驗證碼。</p>
      )}
      {error && <div className="error-message">{error}</div>}
      <button onClick={handleVerifyCode} disabled={timeLeft === 0}>
        驗證碼確認
      </button>
      {timeLeft === 0 && (
        <button onClick={resendCode}>
          重新寄送驗證碼
        </button>
      )}
    </div>
  );
}

export default RegisterVerify;
