import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  background-color: #c53030;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.2s;

  &:hover {
    background-color: #9b2c2c;
  }
`;

const ErrorMsg = styled.p`
  color: #F87171;
  text-align: center;
  margin: 0;
`;

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = '管理員登入 - SUZOO IP Guard';
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await apiClient.post('/auth/admin/login', { email, password });
            login(data.token, data.user);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.message || '管理員登入失敗。');
        }
    };

    return (
        <PageWrapper>
            <FormContainer>
                <Title>管理員登入</Title>
                <StyledForm onSubmit={handleSubmit}>
                    <StyledInput
                        type="email"
                        placeholder="管理員電子郵件"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <StyledInput
                        type="password"
                        placeholder="管理員密碼"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && <ErrorMsg>{error}</ErrorMsg>}
                    <SubmitButton type="submit">登入</SubmitButton>
                </StyledForm>
            </FormContainer>
        </PageWrapper>
    );
};

export default AdminLoginPage;
