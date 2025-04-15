 * Register.jsx
 * 合併原先的企業級 UI 與文字內容，並使用單一 form 狀態及簡潔的前端驗證邏輯。
 * 部署前請先安裝：
 *   npm install styled-components
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

// ----------- styled-components 設計 -----------
const Container = styled.div`
  min-height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
`;

const FormWrapper = styled.form`
  width: 90%;
  max-width: 500px;
  padding: 2rem;
`;

const Title = styled.h1`
  color: #FFD700;
  text-align: center;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 8px #FFD700;
`;

const Label = styled.label`
  display: block;
  margin: 1rem 0 0.5rem 0;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  background: #000;
  color: #fff;
  border: 1px solid ${props => (props.error ? 'red' : '#FFA500')};
  border-radius: 4px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: ${props => (props.error ? 'red' : '#FFA500')};
    box-shadow: 0 0 6px ${props => (props.error ? 'red' : '#FFA500')};
  }
  &::placeholder {
    color: #999;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  background: #000;
  color: #fff;
  border: 1px solid ${props => (props.error ? 'red' : '#FFA500')};
  border-radius: 4px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: ${props => (props.error ? 'red' : '#FFA500')};
    box-shadow: 0 0 6px ${props => (props.error ? 'red' : '#FFA500')};
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.6rem 1rem;
  background: #000;
  color: #FFD700;
  font-size: 1.1rem;
  font-weight: bold;
  border: 2px solid #FFA500;
  border-radius: 4px;
  margin-top: 0.5rem;
  cursor: pointer;
  text-shadow: 0 0 4px #FFD700;
  &:hover, &:focus {
    outline: none;
    box-shadow: 0 0 8px #FFA500;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #fff;
`;

// ----------- 主元件 -----------
function Register() {
  const navigate = useNavigate();

  // 使用單一 form 狀態管理所有欄位（含序號及社群/電商帳號）
  const [form, setForm] = useState({
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
    eBay: '',
    Taobao: ''
  });

  // 單一錯誤訊息（顯示前端或後端失敗原因）
  const [error, setError] = useState('');

  // change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // helper：檢查至少填寫一項社群/電商帳號
  const hasOneSocial = () => {
    const { IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, eBay, Taobao } = form;
    return (
      IG.trim() ||
      FB.trim() ||
      YouTube.trim() ||
      TikTok.trim() ||
      Shopee.trim() ||
      Ruten.trim() ||
      Yahoo.trim() ||
      Amazon.trim() ||
      eBay.trim() ||
      Taobao.trim()
    );
  };

  // 表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 前端必填驗證
    if (
      !form.email.trim() ||
      !form.userName.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError('必填欄位未填 / Required fields are missing');
      return;
    }

    // 密碼一致檢查
    if (form.password !== form.confirmPassword) {
      setError('密碼不一致 / Passwords do not match');
      return;
    }

    // 角色必選
    if (!form.role) {
      setError('請選擇角色 / Select a role');
      return;
    }

    // 至少填寫一項社群/電商帳號
    if (!hasOneSocial()) {
      setError('請至少提供一項社群或電商帳號 / Provide at least one social/e-commerce account');
      return;
    }

    try {
      // 向後端發送註冊請求
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 後端需要的屬性：排除 confirmPassword
          email: form.email.trim(),
          userName: form.userName.trim(),
          password: form.password,
          role: form.role,
          serialNumber: form.serialNumber.trim(),
          IG: form.IG.trim(),
          FB: form.FB.trim(),
          YouTube: form.YouTube.trim(),
          TikTok: form.TikTok.trim(),
          Shopee: form.Shopee.trim(),
          Ruten: form.Ruten.trim(),
          Yahoo: form.Yahoo.trim(),
          Amazon: form.Amazon.trim(),
          eBay: form.eBay.trim(),
          Taobao: form.Taobao.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        // 後端返回錯誤，如有自訂 message，則顯示
        throw new Error(
          data.message ||
          '註冊失敗，請確認資料或稍後再試 / Registration failed, please check your data and try again.'
        );
      }

      // 若註冊成功，後端可能回傳 token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // 也可在此導向登入頁，或顯示成功訊息
      navigate('/login');
    } catch (err) {
      setError(err.message);
      console.error('Registration error:', err);
    }
  };

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>註冊 / Register</Title>

        {/* 顯示錯誤訊息 */}
        {error && <ErrorText>{error}</ErrorText>}

        {/* Email */}
        <Label htmlFor="email">電子郵件 / Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="請輸入電子郵件 / Enter email"
          value={form.email}
          onChange={handleChange}
          error={!!error && !form.email.trim()}
        />

        {/* Username */}
        <Label htmlFor="userName">使用者名稱 / Username</Label>
        <Input
          id="userName"
          name="userName"
          type="text"
          placeholder="請輸入使用者名稱 / Enter username"
          value={form.userName}
          onChange={handleChange}
          error={!!error && !form.userName.trim()}
        />

        {/* Password */}
        <Label htmlFor="password">密碼 / Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="請輸入密碼 / Enter password"
          value={form.password}
          onChange={handleChange}
          error={!!error && !form.password}
        />

        {/* Confirm Password */}
        <Label htmlFor="confirmPassword">確認密碼 / Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="請再次輸入密碼 / Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={!!error && form.password !== form.confirmPassword}
        />

        {/* Role */}
        <Label htmlFor="role">角色類型 / Role</Label>
        <Select
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          error={!!error && !form.role}
        >
          <option value="" disabled>請選擇角色 / Select Role</option>
          <option value="copyright">著作權 / Copyright</option>
          <option value="trademark">商標 / Trademark</option>
          <option value="both">兩者 / Both</option>
        </Select>

        {/* Serial Number */}
        <Label htmlFor="serialNumber">序號 / Serial Number</Label>
        <Input
          id="serialNumber"
          name="serialNumber"
          type="text"
          placeholder="請輸入序號（若有） / Enter serial number (if any)"
          value={form.serialNumber}
          onChange={handleChange}
        />

        {/* Social/E-commerce Accounts */}
        <Label>社群/電商帳號（至少填寫一項） / Social/E-commerce Accounts (at least one)</Label>
        <Input
          type="text"
          name="IG"
          placeholder="IG 帳號 / IG Account"
          value={form.IG}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="FB"
          placeholder="FB 帳號 / FB Account"
          value={form.FB}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="YouTube"
          placeholder="YouTube 帳號 / YouTube Account"
          value={form.YouTube}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="TikTok"
          placeholder="TikTok 帳號 / TikTok Account"
          value={form.TikTok}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="Shopee"
          placeholder="Shopee 帳號 / Shopee Account"
          value={form.Shopee}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="Ruten"
          placeholder="露天帳號 / Ruten Account"
          value={form.Ruten}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="Yahoo"
          placeholder="Yahoo 帳號 / Yahoo Account"
          value={form.Yahoo}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="Amazon"
          placeholder="Amazon 帳號 / Amazon Account"
          value={form.Amazon}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="eBay"
          placeholder="eBay 帳號 / eBay Account"
          value={form.eBay}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="Taobao"
          placeholder="淘寶帳號 / Taobao Account"
          value={form.Taobao}
          onChange={handleChange}
        />

        <Button type="submit">註冊 / Register</Button>

        <SwitchText>
          已有帳號？{' '}
          <Link to="/login" style={{ color: '#FFD700' }}>
            登入 / Login
          </Link>
        </SwitchText>
      </FormWrapper>
    </Container>
  );
}

export default Register;
