// frontend/src/pages/Register.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [step, setStep] = useState(1);

  // Step 1: Email
  // Step 2: Verify code
  // Step 3: Set password + IG/FB/TikTok
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [igAccount, setIgAccount] = useState('');
  const [facebookAccount, setFacebookAccount] = useState('');
  const [tiktokAccount, setTiktokAccount] = useState('');

  // CAPTCHA
  const [captchaId, setCaptchaId] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [userInputCaptcha, setUserInputCaptcha] = useState('');

  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 進入此頁，就抓一次 captcha
  const fetchCaptcha = async () => {
    try {
      const res = await fetch('/auth/captcha');
      if (!res.ok) throw new Error('無法取得驗證碼');
      const data = await res.json();
      setCaptchaId(data.captchaId);
      setCaptchaText(data.captchaText);
    } catch (err) {
      setError(err.message);
    }
  };

  // 每次 step 改變都刷新驗證碼 (可自行決定)
  useEffect(() => {
    fetchCaptcha();
  }, [step]);

  const handleRefreshCaptcha = () => {
    setUserInputCaptcha('');
    fetchCaptcha();
  };

  // Step 1: 寄送驗證碼
  const handleSendCode = async () => {
    try {
      setError('');
      const res = await fetch('/auth/sendCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          captchaId,
          captchaText: userInputCaptcha
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '無法寄送驗證碼');
      }
      alert('驗證碼已寄出，請至信箱查收');
      setStep(2);
      setUserInputCaptcha('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Step 2: 驗證碼
  const handleCheckCode = async () => {
    try {
      setError('');
      const res = await fetch('/auth/checkCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          captchaId,
          captchaText: userInputCaptcha
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '驗證碼錯誤');
      }
      alert('驗證碼正確，請設定密碼並填寫社群帳號');
      setStep(3);
      setUserInputCaptcha('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Step 3: 完成註冊
  const handleFinalRegister = async () => {
    try {
      setError('');
      const res = await fetch('/auth/finalRegister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          password,
          igAccount,
          facebookAccount,
          tiktokAccount,
          captchaId,
          captchaText: userInputCaptcha
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '註冊失敗');
      }
      alert('註冊成功，請登入');
      navigate('/login');
    } catch (err) {
      setError(err.message);
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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: '2rem'
    }}>
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          textAlign: 'center',
          border: '2px solid orange',
          padding: '20px',
          borderRadius: '8px'
        }}
      >
        <h2>Register (Step {step})</h2>

        {/* Step 1/2/3 都要填 Email */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Email:</label><br/>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            readOnly={step > 1}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
        </div>

        {/* Step 2/3 => 驗證碼 */}
        {step >= 2 && (
          <div style={{ marginBottom: '1rem' }}>
            <label>驗證碼 (寄到您的信箱):</label><br/>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
            />
          </div>
        )}

        {/* Step 3 => 密碼 + IG/FB/Tiktok */}
        {step === 3 && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label>Password:</label><br/>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>IG 帳號 (可空):</label><br/>
              <input
                type="text"
                value={igAccount}
                onChange={e => setIgAccount(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Facebook 帳號 (可空):</label><br/>
              <input
                type="text"
                value={facebookAccount}
                onChange={e => setFacebookAccount(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>TikTok 帳號 (可空):</label><br/>
              <input
                type="text"
                value={tiktokAccount}
                onChange={e => setTiktokAccount(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
              />
            </div>
          </>
        )}

        {/* CAPTCHA 區域 */}
        <div style={{ marginBottom: '1rem' }}>
          <label>驗證碼 (請輸入下列文字):</label><br/>
          <div style={{ fontWeight: 'bold', margin: '5px 0' }}>
            {captchaText || '...'}
          </div>
          <input
            type="text"
            placeholder="輸入上方驗證文字"
            value={userInputCaptcha}
            onChange={e => setUserInputCaptcha(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid orange' }}
          />
          <button 
            type="button"
            onClick={handleRefreshCaptcha}
            style={{ marginTop: '5px', cursor: 'pointer' }}
          >
            刷新驗證碼
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'orange',
            border: 'none',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          {step === 1 ? '寄送驗證碼' : step === 2 ? '驗證碼確認' : '完成註冊'}
        </button>
      </form>
    </div>
  );
}

export default Register;
