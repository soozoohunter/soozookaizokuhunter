import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import styled, { css } from 'styled-components'; // ★ 引入 css
import { AuthContext } from '../AuthContext';
import { apiClient } from '../apiClient';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 6rem 1rem;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.dark.background};
  color: ${({ theme }) => theme.colors.dark.text};
`;

const FormContainer = styled.div`
  padding: 2.5rem;
  background: ${({ theme }) => theme.colors.dark.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  box-shadow: ${({ theme }) => theme.shadows.dark};
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
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

// ★★★ 關鍵修正 1：抽出共用樣式 ★★★
const inputStyles = css`
  padding: 0.8rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.dark.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.dark.background};
  color: ${({ theme }) => theme.colors.dark.text};
  font-size: 1rem;
  font-family: inherit;
`;

const StyledInput = styled.input`
  ${inputStyles}
`;

// ★★★ 關鍵修正 2：建立一個新的 StyledTextarea 元件 ★★★
const StyledTextarea = styled.textarea`
  ${inputStyles}
  height: 80px;
  resize: vertical;
`;

const SubmitButton = styled.button`
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.colors.dark.primary};
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    background: #555;
  }
`;

const ErrorMsg = styled.p`
  color: #ff6f6f;
  text-align: center;
  margin-top: 1rem;
  min-height: 1.2em;
`;

const SummaryCard = styled.div`
  background: rgba(255,255,255,0.05);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
`;

const PaymentInfo = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.dark.border};
  margin-top: 2rem;
  padding-top: 2rem;
`;

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);

  const [plan, setPlan] = useState(searchParams.get('plan') || 'CREATOR');
  const [price, setPrice] = useState(searchParams.get('price') || '390');
  const [formData, setFormData] = useState({ email: '', lastFive: '', notes: '' });
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email }));
    } else {
      setMessage(<>請先 <Link to="/login" style={{color: '#D45398'}}>登入</Link> 或 <Link to="/register" style={{color: '#D45398'}}>註冊</Link>，以便我們將方案啟用在您的帳戶上。</>);
    }
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.lastFive.trim()) {
      setMessage('請填寫您的轉帳帳號後五碼。');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const payload = { planCode: plan, amount: price, accountLastFive: formData.lastFive, userEmail: formData.email, notes: formData.notes };
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
            <p style={{ textAlign: 'center', lineHeight: 1.6 }}>{message}</p>
            <SubmitButton style={{ marginTop: '2rem' }} onClick={() => navigate('/dashboard')}>前往會員中心</SubmitButton>
          </div>
        ) : (
          <>
            <Title>啟用訂閱方案</Title>
            <SummaryCard>
              <h3>您選擇的方案：{plan}</h3>
              <p style={{fontSize: '2rem', fontWeight: 'bold'}}>金額：NT$ {price} / 月</p>
            </SummaryCard>
            <PaymentInfo>
              <h4>步驟一：銀行轉帳</h4>
              <p>請轉帳至以下帳戶，並在**備註欄填寫您的註冊 Email**：</p>
              <p><strong>銀行：</strong> 遠東國際商業銀行 (805)</p>
              <p><strong>帳號：</strong> 00200400371797</p>
            </PaymentInfo>
            <StyledForm onSubmit={handleSubmit} style={{marginTop: '2rem'}}>
              <h4>步驟二：提交付款證明</h4>
              <StyledInput name="email" type="email" placeholder="您的註冊 Email" value={formData.email} onChange={handleChange} required disabled />
              <StyledInput name="lastFive" type="text" placeholder="您的轉帳帳號後五碼" value={formData.lastFive} onChange={handleChange} required />
              
              {/* ★★★ 關鍵修正 3：使用新的 StyledTextarea 元件 ★★★ */}
              <StyledTextarea name="notes" placeholder="其他備註事項 (可選)" value={formData.notes} onChange={handleChange} />

              <SubmitButton type="submit" disabled={isLoading || !user}>
                {isLoading ? '提交中...' : '我已完成轉帳，提交證明'}
              </SubmitButton>
              {message && <ErrorMsg>{message}</ErrorMsg>}
            </StyledForm>
          </>
        )}
      </FormContainer>
    </PageWrapper>
  );
};

export default PaymentPage;
