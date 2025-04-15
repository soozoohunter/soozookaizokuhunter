import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

// Reuse styled-components from Login where appropriate, or redefine for clarity
const Container = styled.div`
  min-height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
`;

const Form = styled.form`
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
  margin: 0 0 0.5rem 0;
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #fff;
`;

function Register() {
  const navigate = useNavigate();
  // Form field states
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');  // role value: 'copyright' | 'trademark' | 'both'
  // Social/E-commerce accounts states
  const [accounts, setAccounts] = useState({
    IG: '', FB: '', YouTube: '', TikTok: '',
    Shopee: '', Ruten: '', Yahoo: '', Amazon: '', eBay: '', Taobao: ''
  });
  // Error states for fields
  const [errorEmail, setErrorEmail] = useState('');
  const [errorUserName, setErrorUserName] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorConfirmPassword, setErrorConfirmPassword] = useState('');
  const [errorRole, setErrorRole] = useState('');
  const [errorAccounts, setErrorAccounts] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  // Helper: basic email format check (simple regex or includes)
  const isValidEmail = (str) => {
    return /\S+@\S+\.\S+/.test(str);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    let valid = true;
    // Validate email
    if (!email.trim()) {
      setErrorEmail('請輸入電子郵件 / Enter email');
      valid = false;
    } else if (!isValidEmail(email.trim())) {
      setErrorEmail('電子郵件格式不正確 / Invalid email format');
      valid = false;
    } else {
      setErrorEmail('');
    }
    // Validate username
    if (!userName.trim()) {
      setErrorUserName('請輸入使用者名稱 / Enter username');
      valid = false;
    } else {
      setErrorUserName('');
    }
    // Validate password
    if (!password) {
      setErrorPassword('請輸入密碼 / Enter password');
      valid = false;
    } else {
      setErrorPassword('');
    }
    // Validate confirmPassword matches
    if (!confirmPassword) {
      setErrorConfirmPassword('請再次輸入密碼 / Re-enter password');
      valid = false;
    } else if (password && confirmPassword && password !== confirmPassword) {
      setErrorConfirmPassword('兩次密碼不一致 / Passwords do not match');
      valid = false;
    } else {
      setErrorConfirmPassword('');
    }
    // Validate role selected
    if (!role) {
      setErrorRole('請選擇角色 / Select a role');
      valid = false;
    } else {
      setErrorRole('');
    }
    // Validate at least one social/e-commerce account
    const hasOneAccount = Object.values(accounts).some(val => val.trim() !== '');
    if (!hasOneAccount) {
      setErrorAccounts('請至少提供一項社群或電商帳號 / Provide at least one social/e-commerce account');
      valid = false;
    } else {
      setErrorAccounts('');
    }
    if (!valid) {
      return; // stop if any validation failed
    }
    try {
      // Prepare data to submit (exclude confirmPassword)
      const payload = {
        email: email.trim(),
        userName: userName.trim(),
        password: password,
        role: role,
        // Include all accounts fields (empty strings if not provided)
        ...accounts
      };
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        // Registration failed, capture error message if available
        // const errData = await res.json();
        // setErrorGeneral(errData.message || '註冊失敗 / Registration failed');
        setErrorGeneral('註冊失敗，請確認資料或稍後再試 / Registration failed, please check your data and try again');
      } else {
        // On success, redirect to login page
        navigate('/login');
      }
    } catch (err) {
      setErrorGeneral('註冊發生錯誤 / An error occurred during registration');
      console.error('Register error:', err);
    }
  };

  // Handler for social accounts input change
  const handleAccountChange = (field, value) => {
    setAccounts(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Container>
      <Form onSubmit={handleRegister}>
        <Title>註冊 / Register</Title>
        {/* Email */}
        <Label htmlFor="email">電子郵件 / Email</Label>
        <Input 
          id="email"
          type="email"
          placeholder="請輸入電子郵件 / Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!errorEmail}
        />
        {errorEmail && <ErrorText>{errorEmail}</ErrorText>}
        {/* Username */}
        <Label htmlFor="new-username">使用者名稱 / Username</Label>
        <Input 
          id="new-username"
          type="text"
          placeholder="請輸入使用者名稱 / Enter username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          error={!!errorUserName}
        />
        {errorUserName && <ErrorText>{errorUserName}</ErrorText>}
        {/* Password */}
        <Label htmlFor="new-password">密碼 / Password</Label>
        <Input 
          id="new-password"
          type="password"
          placeholder="請輸入密碼 / Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errorPassword || !!errorConfirmPassword}
        />
        {errorPassword && <ErrorText>{errorPassword}</ErrorText>}
        {/* Confirm Password */}
        <Label htmlFor="confirm-password">確認密碼 / Confirm Password</Label>
        <Input 
          id="confirm-password"
          type="password"
          placeholder="請再次輸入密碼 / Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={!!errorConfirmPassword}
        />
        {errorConfirmPassword && <ErrorText>{errorConfirmPassword}</ErrorText>}
        {/* Role Selection */}
        <Label htmlFor="role">角色類型 / Role</Label>
        <Select 
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          error={!!errorRole}
        >
          <option value="" disabled>請選擇角色 / Select Role</option>
          <option value="copyright">著作權 / Copyright</option>
          <option value="trademark">商標 / Trademark</option>
          <option value="both">兩者 / Both</option>
        </Select>
        {errorRole && <ErrorText>{errorRole}</ErrorText>}
        {/* Social/E-commerce Accounts Section */}
        <Label>社群/電商帳號（至少填寫一項） / Social/E-commerce Accounts (at least one)</Label>
        {/* We will create an input for each account type */}
        <Input 
          type="text"
          placeholder="IG 帳號 / IG Account"
          value={accounts.IG}
          onChange={(e) => handleAccountChange('IG', e.target.value)}
        />
        <Input 
          type="text"
          placeholder="FB 帳號 / FB Account"
          value={accounts.FB}
          onChange={(e) => handleAccountChange('FB', e.target.value)}
        />
        <Input 
          type="text"
          placeholder="YouTube 帳號 / YouTube Account"
          value={accounts.YouTube}
          onChange={(e) => handleAccountChange('YouTube', e.target.value)}
        />
        <Input 
          type="text"
          placeholder="TikTok 帳號 / TikTok Account"
          value={accounts.TikTok}
          onChange={(e) => handleAccountChange('TikTok', e.target.value)}
        />
        <Input 
          type="text"
          placeholder="Shopee 帳號 / Shopee Account"
          value={accounts.Shopee}
          onChange={(e) => handleAccountChange('Shopee', e.target.value)}
        />
        <Input 
          type="text"
          placeholder="露天帳號 / Ruten Account"
          value={accounts.Ruten}
          onChange={(e) => handleAccountChange('Ruten', e.target.value)}
        />
        <Input 
          type="text"
          placeholder="Yahoo 帳號 / Yahoo Account"
          value={accounts.Yahoo}
          onChange={(e) => handleAccountChange('Yahoo', e.target.value)}
        />
        <Input 
          type="text"
          placeholder="Amazon 帳號 / Amazon Account"
          value={accounts.Amazon}
          onChange={(e) => handleAccountChange('Amazon', e.target.value)}
        />
        <Input 
          type="text"
          placeholder="eBay 帳號 / eBay Account"
          value={accounts.eBay}
          onChange={(e) => handleAccountChange('eBay', e.target.value)}
        />
        <Input 
          type="text"
          placeholder="淘寶帳號 / Taobao Account"
          value={accounts.Taobao}
          onChange={(e) => handleAccountChange('Taobao', e.target.value)}
        />
        {errorAccounts && <ErrorText>{errorAccounts}</ErrorText>}
        {/* General error (e.g. registration failed) */}
        {errorGeneral && <ErrorText>{errorGeneral}</ErrorText>}
        {/* Submit button */}
        <Button type="submit">註冊 / Register</Button>
        {/* Switch to Login link */}
        <SwitchText>
          已有帳號？ <Link to="/login" style={{color: '#FFD700'}}>登入 / Login</Link>
        </SwitchText>
      </Form>
    </Container>
  );
}

export default Register;
