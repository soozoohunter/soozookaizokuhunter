import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  // 定義各欄位的狀態
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [IG, setIG] = useState('');
  const [FB, setFB] = useState('');
  const [YouTube, setYouTube] = useState('');
  const [TikTok, setTikTok] = useState('');
  const [Shopee, setShopee] = useState('');
  const [Ruten, setRuten] = useState('');
  const [Yahoo, setYahoo] = useState('');
  const [Amazon, setAmazon] = useState('');
  const [eBay, setEbay] = useState('');
  const [Taobao, setTaobao] = useState('');
  const [error, setError] = useState('');       // 錯誤訊息狀態

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // 清空舊的錯誤訊息

    // 簡單前端驗證：必要欄位不可空白，密碼需一致
    if (!email || !userName || !password || !confirmPassword || !role) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }

    // 準備送出的使用者資料物件（serialNumber 不用傳，由後端產生）
    const newUserData = {
      email,
      userName,
      password,
      role,
      IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, eBay, Taobao
    };

    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });
      if (res.ok) {
        // 註冊成功，導向登入頁面
        alert('註冊成功，請登入');  // 簡單提示，可選
        navigate('/login');
      } else {
        // 註冊失敗，取得錯誤訊息並顯示
        const data = await res.json();
        setError(data.message || '註冊失敗，請重試');
      }
    } catch (err) {
      console.error('Network error during registration:', err);
      setError('網路錯誤，請稍後再試');
    }
  };

  return (
    <div className="register-page">
      <h2>會員註冊</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email：
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </label>
        </div>
        <div>
          <label>使用者名稱：
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
              required 
            />
          </label>
        </div>
        <div>
          <label>密碼：
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </label>
        </div>
        <div>
          <label>確認密碼：
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </label>
        </div>
        <div>
          <label>角色：
            <select value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="">-- 請選擇角色 --</option>
              <option value="user">一般會員</option>
              <option value="admin">管理員</option>
            </select>
          </label>
        </div>
        {/* 各社群/平台帳號欄位，非必填 */}
        <div>
          <label>IG：
            <input 
              type="text" 
              value={IG} 
              onChange={(e) => setIG(e.target.value)} 
              placeholder="Instagram 帳號"
            />
          </label>
        </div>
        <div>
          <label>FB：
            <input 
              type="text" 
              value={FB} 
              onChange={(e) => setFB(e.target.value)} 
              placeholder="Facebook 帳號"
            />
          </label>
        </div>
        <div>
          <label>YouTube：
            <input 
              type="text" 
              value={YouTube} 
              onChange={(e) => setYouTube(e.target.value)} 
              placeholder="YouTube 頻道/帳號"
            />
          </label>
        </div>
        <div>
          <label>TikTok：
            <input 
              type="text" 
              value={TikTok} 
              onChange={(e) => setTikTok(e.target.value)} 
              placeholder="TikTok 帳號"
            />
          </label>
        </div>
        <div>
          <label>Shopee：
            <input 
              type="text" 
              value={Shopee} 
              onChange={(e) => setShopee(e.target.value)} 
              placeholder="蝦皮賣場帳號"
            />
          </label>
        </div>
        <div>
          <label>露天：
            <input 
              type="text" 
              value={Ruten} 
              onChange={(e) => setRuten(e.target.value)} 
              placeholder="露天拍賣帳號"
            />
          </label>
        </div>
        <div>
          <label>Yahoo拍賣：
            <input 
              type="text" 
              value={Yahoo} 
              onChange={(e) => setYahoo(e.target.value)} 
              placeholder="Yahoo拍賣帳號"
            />
          </label>
        </div>
        <div>
          <label>Amazon：
            <input 
              type="text" 
              value={Amazon} 
              onChange={(e) => setAmazon(e.target.value)} 
              placeholder="Amazon 賣家帳號"
            />
          </label>
        </div>
        <div>
          <label>eBay：
            <input 
              type="text" 
              value={eBay} 
              onChange={(e) => setEbay(e.target.value)} 
              placeholder="eBay 帳號"
            />
          </label>
        </div>
        <div>
          <label>Taobao：
            <input 
              type="text" 
              value={Taobao} 
              onChange={(e) => setTaobao(e.target.value)} 
              placeholder="淘寶帳號"
            />
          </label>
        </div>

        <button type="submit">註冊</button>
      </form>
    </div>
  );
}

export default Register;
