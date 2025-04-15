import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  // 表單欄位的狀態初始化
  const [formData, setFormData] = useState({
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
    role: '',
    serialNumber: '',
    IG: '',
    FB: '',
    YouTube: '',
    TikTok: '',
    Shopee: '',
    Ruten: '',
    Yahoo: '',
    Amazon: '',
    Taobao: '',
    eBay: ''
  });
  const [error, setError] = useState('');

  // 處理輸入變更的通用函式
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 表單提交處理
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 前端驗證：檢查必要欄位是否填寫
    const { email, userName, password, confirmPassword, role, serialNumber, ...accounts } = formData;
    if (!email || !userName || !password || !confirmPassword || !role || !serialNumber) {
      setError('請完整填寫所有必填欄位');
      return;
    }
    // 檢查密碼與確認密碼一致
    if (password !== confirmPassword) {
      setError('密碼與確認密碼不一致');
      return;
    }
    // 檢查至少填寫一個社群/電商帳號
    const hasAccount = Object.values(accounts).some(acc => acc && acc.trim() !== '');
    if (!hasAccount) {
      setError('請至少填寫一項社群或電商平台帳號');
      return;
    }

    try {
      // 呼叫後端 API 進行註冊
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (response.ok) {
        // 註冊成功：提示並導向登入頁
        alert('註冊成功，請使用您的用戶名稱登入');
        navigate('/login');
      } else {
        // 註冊失敗：顯示後端回傳的錯誤訊息
        setError(result.error || '註冊失敗，請稍後再試');
      }
    } catch (err) {
      console.error('Registration error', err);
      setError('發生未知錯誤，請稍後再試');
    }
  };

  return (
    <div style={{ padding: '2em' }}>
      <h2>會員註冊</h2>
      <form onSubmit={handleSubmit}>
        {/* Email 欄位 */}
        <label htmlFor="email">電子郵件 Email</label>
        <input 
          id="email" name="email" type="email" 
          value={formData.email} onChange={handleChange} 
          placeholder="請輸入電子郵件" required 
        />

        {/* 使用者名稱欄位 */}
        <label htmlFor="userName">
          用戶名稱 <span style={{ fontWeight: 'normal' }}>（將作為日後登入帳號）</span>
        </label>
        <input 
          id="userName" name="userName" type="text" 
          value={formData.userName} onChange={handleChange} 
          placeholder="請設定用戶名稱" required 
        />

        {/* 密碼欄位 */}
        <label htmlFor="password">密碼 Password</label>
        <input 
          id="password" name="password" type="password" 
          value={formData.password} onChange={handleChange} 
          placeholder="請設定密碼" required 
        />

        {/* 確認密碼欄位 */}
        <label htmlFor="confirmPassword">確認密碼 Confirm Password</label>
        <input 
          id="confirmPassword" name="confirmPassword" type="password" 
          value={formData.confirmPassword} onChange={handleChange} 
          placeholder="再次輸入密碼" required 
        />

        {/* 角色選擇欄位 */}
        <label htmlFor="role">角色 Role</label>
        <select id="role" name="role" value={formData.role} onChange={handleChange} required>
          <option value="" disabled>-- 請選擇角色 --</option>
          <option value="copyright">著作權 (Copyright)</option>
          <option value="trademark">商標權 (Trademark)</option>
          <option value="both">兩者皆有 (Both)</option>
        </select>

        {/* 序號欄位 */}
        <label htmlFor="serialNumber">序號 Serial Number</label>
        <input 
          id="serialNumber" name="serialNumber" type="text" 
          value={formData.serialNumber} onChange={handleChange} 
          placeholder="請輸入您的序號" required 
        />

        {/* 社群/電商帳號欄位群組 */}
        <h3>社群/電商平台帳號綁定</h3>
        <p style={{ fontSize: '0.9em', margin: '0 0 0.5em' }}>
          * 請填寫您在各平台上的帳號名稱（至少一項）： 
        </p>
        <label htmlFor="IG">Instagram 帳號</label>
        <input 
          id="IG" name="IG" type="text" 
          value={formData.IG} onChange={handleChange} 
          placeholder="Instagram 用戶名"
        />
        <label htmlFor="FB">Facebook 帳號</label>
        <input 
          id="FB" name="FB" type="text" 
          value={formData.FB} onChange={handleChange} 
          placeholder="Facebook 用戶名"
        />
        <label htmlFor="YouTube">YouTube 頻道</label>
        <input 
          id="YouTube" name="YouTube" type="text" 
          value={formData.YouTube} onChange={handleChange} 
          placeholder="YouTube 頻道名稱"
        />
        <label htmlFor="TikTok">TikTok 帳號</label>
        <input 
          id="TikTok" name="TikTok" type="text" 
          value={formData.TikTok} onChange={handleChange} 
          placeholder="TikTok 用戶名"
        />
        <label htmlFor="Shopee">蝦皮購物帳號 (Shopee)</label>
        <input 
          id="Shopee" name="Shopee" type="text" 
          value={formData.Shopee} onChange={handleChange} 
          placeholder="Shopee 賣場名稱"
        />
        <label htmlFor="Ruten">露天拍賣帳號 (Ruten)</label>
        <input 
          id="Ruten" name="Ruten" type="text" 
          value={formData.Ruten} onChange={handleChange} 
          placeholder="露天拍賣 賣家帳號"
        />
        <label htmlFor="Yahoo">Yahoo奇摩帳號</label>
        <input 
          id="Yahoo" name="Yahoo" type="text" 
          value={formData.Yahoo} onChange={handleChange} 
          placeholder="Yahoo奇摩 賣家名稱"
        />
        <label htmlFor="Amazon">Amazon 賣家帳號</label>
        <input 
          id="Amazon" name="Amazon" type="text" 
          value={formData.Amazon} onChange={handleChange} 
          placeholder="Amazon 商店名稱"
        />
        <label htmlFor="Taobao">淘寶帳號</label>
        <input 
          id="Taobao" name="Taobao" type="text" 
          value={formData.Taobao} onChange={handleChange} 
          placeholder="淘寶 賣家帳號"
        />
        <label htmlFor="eBay">eBay 帳號</label>
        <input 
          id="eBay" name="eBay" type="text" 
          value={formData.eBay} onChange={handleChange} 
          placeholder="eBay 賣家帳號"
        />

        {/* 提交按鈕 */}
        <button type="submit">提交註冊</button>

        {/* 錯誤訊息顯示 */}
        {error && <p className="hint" style={{ color: 'red' }}>{error}</p>}

        {/* 提示語，說明為何要綁定帳號 */}
        <p className="hint">
          註冊時綁定您的社群/電商帳號，可有效證明內容原創性，並作為後續侵權偵測的依據。
        </p>
      </form>
    </div>
  );
}

export default Register;
