import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../AuthContext';
import { apiClient } from '../apiClient';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
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
  max-width: 480px;
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
  gap: 1rem;
`;

const StyledInput = styled.input`
  padding: 0.8rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.dark.background};
  color: ${({ theme }) => theme.colors.dark.text};
`;

const SubmitButton = styled.button`
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.colors.dark.primary};
  color: #fff;
  font-weight: 600;
  cursor: pointer;
`;

const ErrorMsg = styled.p`
  color: #ff6f6f;
`;

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);

  const [plan, setPlan] = useState(searchParams.get('plan') || 'CREATOR');
  const [price, setPrice] = useState(searchParams.get('price') || '390');

  const [formData, setFormData] = useState({
    email: '',
    lastFive: '',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email }));
    } else {
      setMessage('請先登入或註冊，以便我們將方案啟用在您的帳戶上。');
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage('請先登入後再提交付款證明。');
      return;
    }
    if (!formData.lastFive) {
      setMessage('請填寫您的轉帳帳號後五碼。');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const payload = {
        planCode: plan,
        amount: price,
        accountLastFive: formData.lastFive,
        userEmail: formData.email,
        notes: formData.notes
      };
      const response = await apiClient.post('/payments/submit-proof', payload);
      setMessage(response.data.message);
      setIsSubmitted(true);
    } catch (err) {
      setMessage(err.response?.data?.message || '提交失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <FormContainer>
        {isSubmitted ? (
          <div>
            <Title>感謝您的提交！</Title>
            <p>{message}</p>
            <p>我們將在收到款項後盡快為您處理。您可以隨時在會員中心查看您的方案狀態。</p>
            <SubmitButton onClick={() => navigate('/dashboard')}>前往會員中心</SubmitButton>
          </div>
        ) : (
          <>
            <Title>啟用訂閱方案</Title>
            <div className="summary-card">
              <h3>您選擇的方案：{plan}</h3>
              <p className="price">金額：NT$ {price} / 月</p>
            </div>
            <div className="payment-info">
              <h4>步驟一：銀行轉帳</h4>
              <p>請轉帳至以下帳戶，並在<strong>備註欄填寫您的註冊 Email</strong>：</p>
              <p><strong>銀行：</strong> 遠東國際商業銀行 (805)</p>
              <p><strong>帳號：</strong> 00200400371797</p>
            </div>
            <StyledForm onSubmit={handleSubmit}>
              <h4>步驟二：提交付款證明</h4>
              <StyledInput name="email" type="email" placeholder="您的註冊 Email" value={formData.email} onChange={handleChange} required disabled={!!user} />
              <StyledInput name="lastFive" type="text" placeholder="您的轉帳帳號後五碼" value={formData.lastFive} onChange={handleChange} required />
              <textarea name="notes" placeholder="其他備註事項 (可選)" value={formData.notes} onChange={handleChange}></textarea>

              {message && <ErrorMsg>{message}</ErrorMsg>}
              <SubmitButton type="submit" disabled={isLoading || !user}>
                {isLoading ? '提交中...' : '我已完成轉帳，提交證明'}
              </SubmitButton>
            </StyledForm>
          </>
        )}
      </FormContainer>
    </PageWrapper>
  );
};

export default PaymentPage;
