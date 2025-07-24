import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

// 從 PricingPage 複製的通用樣式
const PageSpacer = styled.div` min-height: 74px; `;
const PageWrapper = styled.div` padding: 4rem 2rem; background-color: #f9fafb; `;
const ContentContainer = styled.div` max-width: 1200px; margin: 0 auto; text-align: center; `;
const Header = styled.header` margin-bottom: 4rem; `;
const Title = styled.h1` font-size: 3rem; font-weight: 800; margin-bottom: 1rem; `;
const Subtitle = styled.p` font-size: 1.25rem; color: #6b7280; max-width: 700px; margin: 0 auto; line-height: 1.6; `;

const Section = styled.section` margin: 3rem 0; text-align: left; `;
const SectionTitle = styled.h2` font-size: 2rem; margin-bottom: 1rem; color: #D45398; `;
const StepByStep = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  text-align: center;
  margin-top: 1rem;
`;
const CTASection = styled.div`
  background: #EBB0CF;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  margin-top: 2rem;
`;
const PrimaryButton = styled.button`
  margin-top: 1rem;
  padding: 14px 28px;
  font-weight: 600;
  border: none;
  background: #D45398;
  color: #FFFFFF;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { opacity: 0.9; transform: scale(1.03); }
`;

const BlockchainDeedPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>區塊鏈權狀：神聖不可侵犯的數位產權</Title>
            <Subtitle>在數位世界，證明「你是第一個創作者」比創作本身更重要。傳統證據易被偽造，曠日廢時。SUZOO 為您提供的是基於區塊鏈的、全球公認的永久產權證明。</Subtitle>
          </Header>
          <Section>
            <SectionTitle>為何您需要區塊鏈權狀？</SectionTitle>
            <p>每一次創作的誕生，都代表著無價的心血與智慧。沒有即時的權利證明，侵權者便能輕易竄改發表時間或主張所有權，讓您陷入漫長又昂貴的訴訟。透過區塊鏈權狀，您能立即取得不可篡改的證明，建立無可撼動的法律地位。</p>
          </Section>
          <Section>
            <SectionTitle>它是如何運作的？</SectionTitle>
            <StepByStep>
              <div>Step 1: 上傳作品</div>
              <div>Step 2: AI 生成數位指紋 (SHA-256)</div>
              <div>Step 3: 檔案存入去中心化網路 (IPFS)</div>
              <div>Step 4: 包含時間戳的指紋寫入區塊鏈 (On-Chain)</div>
              <div>Step 5: 生成具備法律效力的 PDF 權狀</div>
            </StepByStep>
          </Section>
          <CTASection>
            <h3>您的下一個傑作，值得擁有一個永久的身份證。</h3>
            <p>不要等到被盜用才後悔莫及。立即為您的作品鑄造一份不可篡改的數位權狀，讓您的創作從誕生的第一秒起，就立於不敗之地。</p>
            <PrimaryButton onClick={() => navigate('/pricing')}>查看方案，立即保護</PrimaryButton>
          </CTASection>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};
export default BlockchainDeedPage;
