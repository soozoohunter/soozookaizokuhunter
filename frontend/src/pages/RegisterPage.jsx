import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '../apiClient';
import { AuthContext } from '../AuthContext';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.dark.background};
`;

const BackButton = styled.button`
  position: absolute;
  top: 2rem;
  left: 2rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  color: ${({ theme }) => theme.colors.dark.textSecondary};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.dark.primary};
    color: ${({ theme }) => theme.colors.dark.text};
  }
`;

const FormContainer = styled.div`
  padding: 2.5rem;
  background: ${({ theme }) => theme.colors.dark.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  box-shadow: ${({ theme }) => theme.shadows.dark};
  width: 100%;
  max-width: 420px;
  color: ${({ theme }) => theme.colors.dark.text};
`;

const Title = styled.h2`
  text-align: center;
  color: ${({ theme }) => theme.colors.dark.accent};
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const StyledInput = styled.input`
  padding: 0.8rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.dark.background};
  color: ${({ theme }) => theme.colors.dark.text};
  font-size: 1rem;
`;

const SubmitButton = styled.button`
  padding: 0.8rem 1rem;
  background-color: ${({ theme }) => theme.colors.dark.primary};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.dark.primaryHover};
  }
`;

const ErrorMsg = styled.p`
  color: #F87171;
  text-align: center;
  margin: 0;
`;

const SwitchLink = styled(Link)`
  color: ${({ theme }) => theme.colors.dark.primary};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const RegisterPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const from = location.state?.from?.pathname;
    const redirectState = location.state;

    useEffect(() => {
        document.title = '註冊 - SUZOO IP Guard';
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('兩次輸入的密碼不一致。');
            return;
        }

        try {
            await apiClient.post('/auth/register', { email, phone, password });
            const loginData = await apiClient.post('/auth/login', { email, password });
            login(loginData.token, loginData.user);

            alert('註冊成功！已為您自動登入。');

            if (from) {
              navigate(from, { state: redirectState, replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            setError(err.message || '註冊失敗，此電子郵件可能已被使用。');
        }
    };

    return (
        <PageWrapper>
            {/* [★★ 關鍵修正 ★★] 加入返回按鈕 */}
            <BackButton onClick={() => navigate(-1)}>← 返回上一頁</BackButton>
            <FormContainer>
                <Title>建立您的保護網</Title>
                <StyledForm onSubmit={handleSubmit}>
                    <StyledInput
                        type="email"
                        placeholder="電子郵件"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <StyledInput
                        type="tel"
                        placeholder="手機號碼"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                    <StyledInput
                        type="password"
                        placeholder="密碼"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <StyledInput
                        type="password"
                        placeholder="確認密碼"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {error && <ErrorMsg>{error}</ErrorMsg>}
                    <SubmitButton type="submit">註冊</SubmitButton>
                    <p style={{ textAlign: 'center' }}>
                        已經有帳號了？ <SwitchLink to="/login">前往登入</SwitchLink>
                    </p>
                </StyledForm>
            </FormContainer>
        </PageWrapper>
    );
};

export default RegisterPage;

