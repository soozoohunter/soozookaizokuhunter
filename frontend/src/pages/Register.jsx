import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

export default function Register() {
  const navigate = useNavigate();
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

  // 檢查是否至少填一個社群/電商欄位
  function hasOnePlatform() {
    const {
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, eBay, Taobao
    } = form;
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
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 必填欄位檢查
    if (!form.email.trim() || !form.userName.trim() || !form.password || !form.confirmPassword) {
      return setError('必填欄位未填 (Required fields missing)');
    }
    if (form.password !== form.confirmPassword) {
      return setError('密碼不一致 (Passwords do not match)');
    }
    if (!hasOnePlatform()) {
      return setError('請至少填寫一個社群/電商帳號');
    }

    try {
      const resp = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.message || '註冊失敗');
      }

      alert('註冊成功 / Registration successful!');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  const showPlatformAlert = !hasOnePlatform();

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>Register / 註冊</Title>
        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Label>Email</Label>
        <Input
          name="email"
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
        />

        <Label>Username</Label>
        <Input
          name="userName"
          type="text"
          placeholder="Enter your username"
          value={form.userName}
          onChange={handleChange}
        />

        <Label>Password</Label>
        <Input
          name="password"
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
        />

        <Label>Confirm Password</Label>
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        {/* 提示欄位：填寫社群/電商帳號的重要性 */}
        <NoteBox>
          為了區塊鏈「原創性」證明，請至少填寫一個社群/電商帳號，
          以便我們能在智慧合約中綁定您的多平台證明。
        </NoteBox>

        {showPlatformAlert && (
          <AlertBox>
            尚未填寫任何平台帳號 / No social/ecom account yet!
          </AlertBox>
        )}

        {/* 社群平台 */}
        <Label>IG</Label>
        <Input name="IG" placeholder="Instagram" onChange={handleChange} />
        <Label>FB</Label>
        <Input name="FB" placeholder="Facebook" onChange={handleChange} />
        <Label>YouTube</Label>
        <Input name="YouTube" placeholder="YouTube" onChange={handleChange} />
        <Label>TikTok</Label>
        <Input name="TikTok" placeholder="TikTok" onChange={handleChange} />

        {/* 電商平台 */}
        <Label>Shopee</Label>
        <Input name="Shopee" placeholder="Shopee" onChange={handleChange} />
        <Label>Ruten</Label>
        <Input name="Ruten" placeholder="Ruten Auction" onChange={handleChange} />
        <Label>Yahoo</Label>
        <Input name="Yahoo" placeholder="Yahoo Auction" onChange={handleChange} />
        <Label>Amazon</Label>
        <Input name="Amazon" placeholder="Amazon Store" onChange={handleChange} />
        <Label>eBay</Label>
        <Input name="eBay" placeholder="eBay Seller" onChange={handleChange} />
        <Label>Taobao</Label>
        <Input name="Taobao" placeholder="Taobao / Tmall" onChange={handleChange} />

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

/* ========== styled-components ========== */

const Container = styled.div`
  background: #000;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

const FormWrapper = styled.form`
  width: 90%;
  max-width: 480px;
  background: #101010;
  border: 2px solid #ff6f00;
  border-radius: 8px;
  padding: 2rem;
`;

const Title = styled.h1`
  color: #FFD700;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  margin-top: 1rem;
  display: block;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border: 1px solid #FFA500;
  border-radius: 4px;
  background: #000;
  color: #fff;
`;

const NoteBox = styled.div`
  background: rgba(255,165,0,0.1);
  border: 1px dashed #FFA500;
  padding: 0.8rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: #FFD700;
  font-size: 0.9rem;
`;

const AlertBox = styled.div`
  background: rgba(255,0,0,0.1);
  border: 1px dashed red;
  color: #ff6666;
  padding: 0.8rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const ErrorMsg = styled.div`
  color: red;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  width: 100%;
  margin-top: 1.2rem;
  padding: 0.6rem 1rem;
  background: #000;
  border: 2px solid #FFA500;
  border-radius: 4px;
  color: #FFD700;
  font-weight: bold;
  cursor: pointer;
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;
