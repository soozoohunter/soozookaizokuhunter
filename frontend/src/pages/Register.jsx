import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

// 容器
const Container = styled.div`
  min-height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
`;

// 表單外框
const FormWrapper = styled.form`
  width: 90%;
  max-width: 500px;
  padding: 2rem;
`;

// 標題
const Title = styled.h1`
  color: #FFD700;
  text-align: center;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 8px #FFD700;
`;

// 標籤
const Label = styled.label`
  display: block;
  margin: 1rem 0 0.5rem 0;
  font-weight: bold;
`;

// 輸入框
const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  background: #000;
  color: #fff;
  border: 1px solid #FFA500;
  border-radius: 4px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #FFA500;
    box-shadow: 0 0 6px #FFA500;
  }
  &::placeholder {
    color: #999;
  }
`;

// 提交按鈕
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

// 錯誤訊息
const ErrorText = styled.p`
  color: red;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
`;

// 底部切換文字
const SwitchText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #fff;
`;

// ---- 組件開始 ----
function Register() {
  const navigate = useNavigate();

  // 註冊表單
  const [form, setForm] = useState({
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
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
  const [error, setError] = useState('');

  // 至少一項社群或電商
  const hasOneSocialOrEcommerce = () => {
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

  // 監聽改變
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 簡單檢查必填
    if (!form.email.trim() || !form.userName.trim() || !form.password || !form.confirmPassword) {
      setError('必填欄位未填 / Required fields missing');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('密碼不一致 / Passwords do not match');
      return;
    }

    // 若仍需「至少一項社群 / 電商」
    if (!hasOneSocialOrEcommerce()) {
      setError('請至少提供一項社群或電商帳號');
      return;
    }

    try {
      // 傳到後端
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '註冊失敗');
      }

      // 若後端回傳 token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>註冊 / Register</Title>

        {error && <ErrorText>{error}</ErrorText>}

        <Label>Email (可搭配密碼登入)</Label>
        <Input
          name="email"
          type="email"
          placeholder="請輸入電子郵件"
          value={form.email}
          onChange={handleChange}
        />

        <Label>使用者名稱 (可搭配密碼登入)</Label>
        <Input
          name="userName"
          type="text"
          placeholder="輸入使用者名稱"
          value={form.userName}
          onChange={handleChange}
        />

        <Label>密碼</Label>
        <Input
          name="password"
          type="password"
          placeholder="請輸入密碼"
          value={form.password}
          onChange={handleChange}
        />

        <Label>確認密碼</Label>
        <Input
          name="confirmPassword"
          type="password"
          placeholder="再次輸入密碼"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        {/* 顯示「社群 / 電商帳號」區域，加強顏色 & 字體大小 */}
        <Label style={{ color: '#FFA500', fontSize: '1.1rem', marginTop:'1.5rem' }}>
          社群 / 電商帳號 (至少一項)
        </Label>

        <Input name="IG" placeholder="IG 帳號" onChange={handleChange} />
        <Input name="FB" placeholder="FB 帳號" onChange={handleChange} />
        <Input name="YouTube" placeholder="YouTube" onChange={handleChange} />
        <Input name="TikTok" placeholder="TikTok" onChange={handleChange} />
        <Input name="Shopee" placeholder="蝦皮" onChange={handleChange} />
        <Input name="Ruten" placeholder="露天拍賣" onChange={handleChange} />
        <Input name="Yahoo" placeholder="Yahoo拍賣" onChange={handleChange} />
        <Input name="Amazon" placeholder="Amazon" onChange={handleChange} />
        <Input name="eBay" placeholder="eBay" onChange={handleChange} />
        <Input name="Taobao" placeholder="淘寶" onChange={handleChange} />

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
