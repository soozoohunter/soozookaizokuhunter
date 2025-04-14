// frontend/src/pages/Register.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  // 基本欄位
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');

  // 用途: 'copyright' or 'trademark'
  const [usageType, setUsageType] = useState('');

  // 如果用途=copyright → 填社群
  const [igAccount, setIgAccount] = useState('');
  const [facebookAccount, setFacebookAccount] = useState('');
  const [tiktokAccount, setTiktokAccount] = useState('');
  const [youtubeAccount, setYoutubeAccount] = useState('');

  // 如果用途=trademark → 填電商賣場
  const [shopeeAccount, setShopeeAccount] = useState('');
  const [rutenAccount, setRutenAccount] = useState('');
  const [amazonAccount, setAmazonAccount] = useState('');
  const [ebayAccount, setEbayAccount] = useState('');
  const [taobaoAccount, setTaobaoAccount] = useState('');

  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 送出表單
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 將所有欄位送到後端
      const body = {
        email,
        userName,
        password,
        usageType,
        igAccount,
        facebookAccount,
        tiktokAccount,
        youtubeAccount,
        shopeeAccount,
        rutenAccount,
        amazonAccount,
        ebayAccount,
        taobaoAccount
      };

      // 後端路由: /auth/register
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: '2rem'
    }}>
      <form
        onSubmit={handleRegister}
        noValidate
        style={{
          textAlign: 'center',
          border: '2px solid orange',
          padding: '20px',
          borderRadius: '8px'
        }}
      >
        <h2 style={{ color: 'orange', marginBottom: '1rem' }}>會員註冊</h2>

        {/* Email */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
            Email (必填):
          </label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid orange'
            }}
          />
        </div>

        {/* 使用者名稱 */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
            使用者名稱 (必填):
          </label>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid orange'
            }}
          />
        </div>

        {/* 密碼 */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
            密碼 (必填):
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid orange'
            }}
          />
        </div>

        {/* 用途(usageType) 下拉 */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
            主要用途 (必選):
          </label>
          <select
            value={usageType}
            onChange={e => setUsageType(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid orange'
            }}
          >
            <option value="">-- 請選擇 --</option>
            <option value="copyright">著作權(IG/FB/TikTok/YouTube)</option>
            <option value="trademark">商標(蝦皮/露天/Amazon/eBay/淘寶)</option>
          </select>
        </div>

        {/* copyright → 社群 */}
        {usageType === 'copyright' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                IG 帳號 (必填):
              </label>
              <input
                type="text"
                value={igAccount}
                onChange={e => setIgAccount(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid orange'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                Facebook 帳號 (必填):
              </label>
              <input
                type="text"
                value={facebookAccount}
                onChange={e => setFacebookAccount(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid orange'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                TikTok 帳號 (必填):
              </label>
              <input
                type="text"
                value={tiktokAccount}
                onChange={e => setTiktokAccount(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid orange'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                YouTube 帳號 (必填):
              </label>
              <input
                type="text"
                value={youtubeAccount}
                onChange={e => setYoutubeAccount(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid orange'
                }}
              />
            </div>
          </>
        )}

        {/* trademark → 電商帳號 */}
        {usageType === 'trademark' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                蝦皮 Shopee 帳號 (必填):
              </label>
              <input
                type="text"
                value={shopeeAccount}
                onChange={e => setShopeeAccount(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid orange'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                露天 Ruten 帳號 (必填):
              </label>
              <input
                type="text"
                value={rutenAccount}
                onChange={e => setRutenAccount(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid orange'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                Amazon 帳號 (必填):
              </label>
              <input
                type="text"
                value={amazonAccount}
                onChange={e => setAmazonAccount(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid orange'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                eBay 帳號 (必填):
              </label>
              <input
                type="text"
                value={ebayAccount}
                onChange={e => setEbayAccount(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid orange'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                淘寶 Taobao 帳號 (必填):
              </label>
              <input
                type="text"
                value={taobaoAccount}
                onChange={e => setTaobaoAccount(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid orange'
                }}
              />
            </div>
          </>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <p style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        {/* 送出按鈕 */}
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
          立即註冊
        </button>
      </form>
    </div>
  );
}

export default Register;
