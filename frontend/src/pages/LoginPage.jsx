import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../AuthContext';
import { apiClient } from '../apiClient';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.dark.background};
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
  background-color: ${({ theme, disabled }) => disabled ? '#555' : theme.colors.dark.primary};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.2s;
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.dark.primaryHover};
  }
`;
const ErrorMsg = styled.p`
  color: #F87171;
  text-align: center;
  margin: 0;
  min-height: 1.2em;
`;
const SwitchLink = styled(Link)`
  color: ${({ theme }) => theme.colors.dark.primary};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = '登入 - SUZOO IP Guard';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // response 是完整的 axios 回應物件，實際資料在 response.data 中
      const response = await apiClient.post('/auth/login', {
        identifier: identifier.trim(),
        password
      });

      // 從 response.data 中提取 token 和 user
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('從伺服器返回的資料格式不正確');
      }

      login(token, user);

      const from = location.state?.from || {
        pathname: user.role === 'admin' ? '/admin/dashboard' : '/dashboard'
      };

      navigate(from.pathname + (from.search || ''), { replace: true });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('登入失敗，請檢查您的憑證。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        <Title>登入您的帳戶</Title>
        <StyledForm onSubmit={handleSubmit}>
          <StyledInput
            type="text"
            placeholder="電子郵件或手機號碼"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <StyledInput
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? '登入中...' : '登入'}
          </SubmitButton>
          <p style={{ textAlign: 'center' }}>
            還沒有帳號嗎？ <SwitchLink to="/register">立即註冊</SwitchLink>
          </p>
        </StyledForm>
      </FormContainer>
    </PageWrapper>
  );
};

export default LoginPage;
