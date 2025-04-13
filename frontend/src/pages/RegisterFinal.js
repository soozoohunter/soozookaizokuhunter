import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function RegisterFinal() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const code = location.state?.code || '';
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    username: '',
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    shopee: '',
    ruten: '',
    amazon: '',
    taobao: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email || !code) {
      // 未經驗證碼步驟，返回第一步
      navigate('/register/email');
    }
  }, [email, code, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    setError('');
    const { password, confirmPassword, username, facebook, instagram, youtube, tiktok, shopee, ruten, amazon, taobao } = formData;
    // 檢查必要欄位
    if (!username || !password || !confirmPassword) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }
    // 可以加入密碼強度檢查，例如長度至少 6 字以上（此處略過）
    try {
      const response = await fetch('/auth/finalRegister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, code, username, password, 
          facebook, instagram, youtube, tiktok, shopee, ruten, amazon, taobao 
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || '註冊失敗，請稍後再試');
      } else {
        // 註冊成功，導向登入頁面
        alert('註冊成功，請使用帳號密碼登入'); // 或在登入頁顯示提示
        navigate('/login');
      }
    } catch (err) {
      setError('伺服器發生錯誤，請稍後再試');
    }
  };

  return (
    <div className="register-container">
      <h2>設定帳戶資料</h2>
      <p>電子郵件：<strong>{email}</strong></p>
      <label>密碼 (必填)：</label>
      <input 
        type="password" 
        name="password" 
        value={formData.password} 
        onChange={handleChange} 
      />
      <label>確認密碼 (必填)：</label>
      <input 
        type="password" 
        name="confirmPassword" 
        value={formData.confirmPassword} 
        onChange={handleChange} 
      />
      <label>用戶名稱 (必填)：</label>
      <input 
        type="text" 
        name="username" 
        value={formData.username} 
        onChange={handleChange} 
      />
      <p>社群平台帳號 (可選填)：</p>
      <label>Facebook：</label>
      <input 
        type="text" 
        name="facebook" 
        value={formData.facebook} 
        onChange={handleChange} 
      />
      <label>Instagram：</label>
      <input 
        type="text" 
        name="instagram" 
        value={formData.instagram} 
        onChange={handleChange} 
      />
      <label>YouTube：</label>
      <input 
        type="text" 
        name="youtube" 
        value={formData.youtube} 
        onChange={handleChange} 
      />
      <label>TikTok：</label>
      <input 
        type="text" 
        name="tiktok" 
        value={formData.tiktok} 
        onChange={handleChange} 
      />
      <p>電商平台帳號 (可選填)：</p>
      <label>蝦皮 / Shopee：</label>
      <input 
        type="text" 
        name="shopee" 
        value={formData.shopee} 
        onChange={handleChange} 
      />
      <label>露天 / Ruten：</label>
      <input 
        type="text" 
        name="ruten" 
        value={formData.ruten} 
        onChange={handleChange} 
      />
      <label>Amazon：</label>
      <input 
        type="text" 
        name="amazon" 
        value={formData.amazon} 
        onChange={handleChange} 
      />
      <label>淘寶 / Taobao：</label>
      <input 
        type="text" 
        name="taobao" 
        value={formData.taobao} 
        onChange={handleChange} 
      />
      {error && <div className="error-message">{error}</div>}
      <button onClick={handleRegister}>送出註冊</button>
    </div>
  );
}

export default RegisterFinal;
