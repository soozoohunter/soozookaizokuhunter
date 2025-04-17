import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

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

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', userName: '', password: '', confirmPassword: '', role: '',
    IG: '', FB: '', YouTube: '', TikTok: '',
    Shopee: '', Ruten: '', Yahoo: '', Amazon: '', eBay: '', Taobao: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const hasOneSocialOrEcommerce = () => {
    const { IG, FB, YouTube, TikTok, Shopee, Ruten, Yahoo, Amazon, eBay, Taobao } = form;
    return IG.trim() || FB.trim() || YouTube.trim() || TikTok.trim() || Shopee.trim() || Ruten.trim() || Yahoo.trim() || Amazon.trim() || eBay.trim() || Taobao.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.userName.trim() || !form.password || !form.confirmPassword) {
      setError('必填欄位未填 / Required fields are missing'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('密碼不一致 / Passwords do not match'); return;
    }
    if (!form.role) { setError('請選擇角色 / Select a role'); return; }
    if (!hasOneSocialOrEcommerce()) {
      setError('請至少提供一項社群或電商帳號 / Provide at least one social/e-commerce account'); return;
    }

    try {
      const res = await fetch('/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '註冊失敗，請確認資料或稍後再試');

      if (data.token) localStorage.setItem('token', data.token);
      navigate('/login');
    } catch (err) { setError(err.message); }
  };

  return (
    <Container>
      <FormWrapper onSubmit={handleSubmit}>
        <Title>註冊 / Register</Title>
        {error && <ErrorText>{error}</ErrorText>}

        <Label>Email (未來登入使用)</Label>
        <Input name="email" type="email" placeholder="請輸入電子郵件" onChange={handleChange} />

        <Label>使用者名稱 (未來登入使用)</Label>
        <Input name="userName" type="text" placeholder="未來可用此名稱登入" onChange={handleChange} />

        <Label>密碼</Label>
        <Input name="password" type="password" placeholder="請輸入密碼" onChange={handleChange} />

        <Label>確認密碼</Label>
        <Input name="confirmPassword" type="password" placeholder="請再次輸入密碼" onChange={handleChange} />

        <Label>角色類型</Label>
        <Select name="role" onChange={handleChange}>
          <option value="">請選擇角色</option>
          <option value="copyright">著作權</option>
          <option value="trademark">商標</option>
          <option value="both">兩者</option>
        </Select>

        <Label style={{color:'#FFD700', fontSize:'1.2rem'}}>社群帳號 (至少一項)</Label>
        {['IG','FB','YouTube','TikTok'].map(name=>(<Input key={name} name={name} placeholder={`請輸入 ${name} 帳號`} onChange={handleChange}/>))}

        <Label style={{color:'#FFD700', fontSize:'1.2rem'}}>電商帳號 (至少一項)</Label>
        {['Shopee','Ruten','Yahoo','Amazon','eBay','Taobao'].map(name=>(<Input key={name} name={name} placeholder={`請輸入 ${name} 帳號`} onChange={handleChange}/>))}

        <Button type="submit">註冊 / Register</Button>
        <SwitchText>已有帳號？<Link to="/login" style={{color:'#FFD700'}}>登入 / Login</Link></SwitchText>
      </FormWrapper>
    </Container>
  );
}

export default Register;
