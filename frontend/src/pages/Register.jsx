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

  // 檢查是否填寫至少一個社群/電商平台
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    setError('');

    // 必填欄位檢查
    if (!form.email.trim() || !form.userName.trim() ||
        !form.password || !form.confirmPassword) {
      setError('Required fields are missing / 必填欄位未填');
      return;
    }
    // 密碼一致性
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match / 密碼不一致');
      return;
    }
    // 至少一項社群/電商
    if (!hasOnePlatform()) {
      setError('Please provide at least one social/e-commerce account / 請至少填寫一個社群或電商帳號');
      return;
    }

    // 發送至後端
    try {
      const resp = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Registration failed / 註冊失敗');
      }

      alert('Registration successful! Your info is now on the blockchain / 註冊成功，已上鏈');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  // 動態判斷是否顯示「PlatformAlert」
  const showPlatformAlert = !hasOnePlatform();

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>Register / 註冊</Title>
        {error && <ErrorText>{error}</ErrorText>}

        {/* Email欄位 (可用於登入) */}
        <Label>
          Email 
          <InfoNote>// You can use your email to log in</InfoNote>
        </Label>
        <Input
          name="email"
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
        />

        {/* Username欄位 (亦可用於登入) */}
        <Label>
          Username 
          <InfoNote>// You can also use your username to log in / 您也可使用此帳號登入</InfoNote>
        </Label>
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

        <Notice>
          We strongly encourage you to fill in your social media and e-commerce accounts
          so our system can record proof of “originality” on the blockchain.<br/>
          為確保您的作品能在全球著作權法下證明「原創性」，建議您填寫以下帳號，
          以便在區塊鏈上完成不可竄改的紀錄，未來如遇侵權爭議時可立即舉證。
        </Notice>

        {/* 若尚未填寫任何社群/電商 => 顯示紅框警示 */}
        {showPlatformAlert && (
          <PlatformAlert>
            <strong>Heads up!</strong> You haven’t entered any social or e-commerce accounts yet. 
            <br/>
            <span style={{ fontSize:'0.85rem' }}>
              請至少填寫一個社群 / 電商帳號，否則無法進行「原創性」上鏈證明
            </span>
          </PlatformAlert>
        )}

        {/* 社群平台區塊 */}
        <BlockTitleSocial>Social Media Platforms / 社群平台</BlockTitleSocial>
        <Input name="IG" placeholder="Instagram" value={form.IG} onChange={handleChange} />
        <Input name="FB" placeholder="Facebook" value={form.FB} onChange={handleChange} />
        <Input name="YouTube" placeholder="YouTube" value={form.YouTube} onChange={handleChange} />
        <Input name="TikTok" placeholder="TikTok" value={form.TikTok} onChange={handleChange} />

        {/* 電商平台區塊 */}
        <BlockTitleEcom>E-Commerce Platforms / 電商平台</BlockTitleEcom>
        <Input name="Shopee" placeholder="Shopee" value={form.Shopee} onChange={handleChange} />
        <Input name="Ruten" placeholder="Ruten Auction" value={form.Ruten} onChange={handleChange} />
        <Input name="Yahoo" placeholder="Yahoo Auction" value={form.Yahoo} onChange={handleChange} />
        <Input name="Amazon" placeholder="Amazon Store" value={form.Amazon} onChange={handleChange} />
        <Input name="eBay" placeholder="eBay Seller" value={form.eBay} onChange={handleChange} />
        <Input name="Taobao" placeholder="Taobao / Tmall" value={form.Taobao} onChange={handleChange} />

        <Button type="submit">Register / 註冊</Button>

        <SwitchText>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'#FFD700' }}>
            Login
          </Link>
        </SwitchText>
      </FormWrapper>
    </Container>
  );
}

/* ================= Styled Components ================= */

const Container = styled.div`
  min-height: 100vh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

const FormWrapper = styled.form`
  width: 90%;
  max-width: 480px;
  padding: 2rem;
  background: #101010;
  border: 2px solid #ff6f00;
  border-radius: 8px;
`;

const Title = styled.h1`
  color: #FFD700;
  text-align: center;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 8px #FFD700;
`;

const Label = styled.label`
  margin-top: 1rem;
  font-weight: bold;
  display: block;
`;

const InfoNote = styled.span`
  display: inline-block;
  margin-left: 6px;
  font-size: 0.7rem;
  color: #999;
`;

const Input = styled.input`
  width: 100%;
  background: #000;
  color: #fff;
  border: 1px solid #FFA500;
  border-radius: 4px;
  margin-bottom: 0.6rem;
  padding: 0.5rem;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #FFA500;
    box-shadow: 0 0 6px #FFA500;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

// 顯示「原創性」填寫建議
const Notice = styled.div`
  background: rgba(255,165,0,0.15);
  border: 1px dashed #FFA500;
  padding: 0.8rem;
  margin-top: 1.2rem;
  margin-bottom: 1.2rem;
  color: #FFD700;
  font-size: 0.9rem;
  line-height: 1.4;
`;

// ★ 新增：若尚未填寫任何平台 => 顯示此紅框
const PlatformAlert = styled.div`
  background: rgba(255,0,0,0.15);
  border: 1px dashed red;
  color: #ff6666;
  padding: 0.8rem;
  margin-bottom: 1.2rem;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const BlockTitleSocial = styled.h2`
  font-size: 1.15rem;
  color: #FFA500;
  margin-top: 1.6rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px dashed #FFA500;
  padding-bottom: 0.3rem;
`;

const BlockTitleEcom = styled.h2`
  font-size: 1.15rem;
  color: #FF9500;
  margin-top: 1.6rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px dashed #FF9500;
  padding-bottom: 0.3rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.6rem 1rem;
  margin-top: 1rem;
  background: #000;
  color: #FFD700;
  border: 2px solid #FFA500;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: bold;
  text-shadow: 0 0 4px #FFD700;
  cursor: pointer;
  &:hover, &:focus {
    outline: none;
    box-shadow: 0 0 8px #FFA500;
  }
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #fff;
`;
