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

  // 簡單判斷是否填寫至少一個社群/電商
  const hasOnePlatform = () => {
    const {
      IG, FB, YouTube, TikTok,
      Shopee, Ruten, Yahoo, Amazon, eBay, Taobao
    } = form;
    return (
      IG.trim() || FB.trim() || YouTube.trim() || TikTok.trim() ||
      Shopee.trim() || Ruten.trim() || Yahoo.trim() || Amazon.trim() ||
      eBay.trim() || Taobao.trim()
    );
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // 前端基本檢查
    if (!form.email.trim() || !form.userName.trim() ||
        !form.password || !form.confirmPassword) {
      setError('必填欄位未填 (Required fields missing)');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('密碼不一致 (Passwords do not match)');
      return;
    }
    if (!hasOnePlatform()) {
      setError('請至少填寫一個社群/電商帳號');
      return;
    }

    try {
      const resp = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || data.error || '註冊失敗');
      }

      alert('註冊成功 / Registration successful!');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  // 動態顯示提醒
  const showPlatformAlert = !hasOnePlatform();

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>Register / 註冊</Title>
        {error && <ErrorMsg>{error}</ErrorMsg>}

        {/* Email */}
        <Label>Email</Label>
        <Input
          name="email"
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
        />

        {/* Username */}
        <Label>Username</Label>
        <Input
          name="userName"
          type="text"
          placeholder="Enter username"
          value={form.userName}
          onChange={handleChange}
        />

        {/* Password */}
        <Label>Password</Label>
        <Input
          name="password"
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
        />

        {/* Confirm */}
        <Label>Confirm Password</Label>
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <NoteBox>
          為確保「原創性」證明，請至少填寫一個社群/電商帳號。<br/>
          (At least one social/e-commerce account is recommended for blockchain originality proof.)
        </NoteBox>
        {showPlatformAlert && (
          <AlertBox>
            尚未填寫任何平台帳號 / No social/ecom account yet!
          </AlertBox>
        )}

        {/* 社群平台 */}
        <Subtitle>社群平台 / Social Media</Subtitle>
        <Input name="IG" placeholder="Instagram" onChange={handleChange} />
        <Input name="FB" placeholder="Facebook" onChange={handleChange} />
        <Input name="YouTube" placeholder="YouTube" onChange={handleChange} />
        <Input name="TikTok" placeholder="TikTok" onChange={handleChange} />

        {/* 電商平台 */}
        <Subtitle>電商平台 / E-Commerce</Subtitle>
        <Input name="Shopee" placeholder="Shopee" onChange={handleChange} />
        <Input name="Ruten" placeholder="Ruten Auction" onChange={handleChange} />
        <Input name="Yahoo" placeholder="Yahoo Auction" onChange={handleChange} />
        <Input name="Amazon" placeholder="Amazon Store" onChange={handleChange} />
        <Input name="eBay" placeholder="eBay Seller" onChange={handleChange} />
        <Input name="Taobao" placeholder="Taobao / Tmall" onChange={handleChange} />

        <Button type="submit">註冊 / Register</Button>

        <SwitchText>
          已有帳號？ <Link to="/login" style={{ color:'#FFD700' }}>登入 / Login</Link>
        </SwitchText>
      </FormWrapper>
    </Container>
  );
}

/* ================== styled components ================== */
const Container = styled.div`
  background: #000;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
`;
const FormWrapper = styled.form`
  width: 90%;
  max-width: 480px;
  border: 2px solid #ff6f00;
  padding: 2rem;
  border-radius: 8px;
  background: #101010;
`;
const Title = styled.h1`
  color: #FFD700;
  text-align: center;
  margin-bottom: 1rem;
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
  &:focus {
    outline: none;
    border-color: #FFA500;
    box-shadow: 0 0 6px #FFA500;
  }
`;
const Subtitle = styled.h3`
  margin-top: 1.5rem;
  color: #FFA500;
  border-bottom: 1px dashed #FFA500;
  padding-bottom: 0.3rem;
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
  &:hover {
    box-shadow: 0 0 6px #FFA500;
  }
`;
const SwitchText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;
const ErrorMsg = styled.div`
  color: red;
  margin-bottom: 1rem;
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
