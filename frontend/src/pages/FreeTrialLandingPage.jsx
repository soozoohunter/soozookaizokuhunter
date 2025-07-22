import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const PageWrapper = styled.div`
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: white;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2.5rem;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
`;

const StepsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 2rem 0;
  gap: 1rem;
`;

const Step = styled.div`
  text-align: center;
  flex: 1;
  .number {
    background: white;
    color: #1a2a6c;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    font-weight: bold;
    font-size: 1.2rem;
  }
`;

const TrialForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.2);
  color: white;
  font-size: 1rem;
  &::placeholder { color: rgba(255,255,255,0.7); }
`;

const SubmitButton = styled.button`
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: none;
  background: #EBB0CF;
  color: #0A0101;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 1rem;
`;

const FreeTrialLandingPage = () => {
  const navigate = useNavigate();
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('trial_realName', realName);
    localStorage.setItem('trial_email', email);
    localStorage.setItem('trial_phone', phone);
    navigate('/protect/step1');
  };

  return (
    <PageWrapper>
      <h1>免費體驗，即刻感受王者級保護</h1>
      <p>體驗強大的區塊鏈存證與 AI 侵權偵測系統</p>
      <Card>
        <h2>只需三步驟，為您的創作賦權</h2>
        <StepsContainer>
          <Step>
            <div className="number">1</div>
            <h3>上傳作品</h3>
            <p>圖片 / 影片</p>
          </Step>
          <Step>
            <div className="number">2</div>
            <h3>生成權威證據</h3>
            <p>IPFS + 區塊鏈</p>
          </Step>
          <Step>
            <div className="number">3</div>
            <h3>獲取侵權摘要</h3>
            <p>AI 全網掃描</p>
          </Step>
        </StepsContainer>
        <TrialForm onSubmit={handleSubmit}>
          <h3>填寫資料，立即開始</h3>
          <Input type="text" value={realName} onChange={(e) => setRealName(e.target.value)} placeholder="您的姓名或品牌名稱" required />
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="您的電子郵件" required />
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="您的手機號碼" required />
          <SubmitButton type="submit">開始免費體驗</SubmitButton>
          <p style={{fontSize: '0.8rem', textAlign: 'center', opacity: 0.7}}>
            點擊即表示您同意我們的服務條款。體驗後將收到完整功能解鎖方案。
          </p>
        </TrialForm>
      </Card>
    </PageWrapper>
  );
};

export default FreeTrialLandingPage;
