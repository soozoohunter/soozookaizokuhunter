import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const PageSpacer = styled.div` min-height: 74px; `;
const PageWrapper = styled.div` padding: 4rem 2rem; background-color: #f9fafb; `;
const ContentContainer = styled.div` max-width: 1200px; margin: 0 auto; text-align: center; `;
const Header = styled.header` margin-bottom: 4rem; `;
const Title = styled.h1` font-size: 3rem; font-weight: 800; margin-bottom: 1rem; `;
const Subtitle = styled.p` font-size: 1.25rem; color: #6b7280; max-width: 700px; margin: 0 auto; line-height: 1.6; `;
const PricingGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; align-items: stretch; @media(max-width: 992px) { grid-template-columns: 1fr; }`;
const Card = styled.div`
  background: white;
  border: 2px solid ${({ featured }) => (featured ? '#D45398' : '#E5E7EB')};
  border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; text-align: left;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transform: ${({ featured }) => (featured ? 'scale(1.05)' : 'scale(1)')};
  transition: all 0.3s ease; position: relative;
  &:hover { transform: translateY(-10px) ${({ featured }) => (featured ? 'scale(1.05)' : 'scale(1.02)')}; }
`;
const PlanName = styled.h3` font-size: 1.5rem; font-weight: 700; color: #111827; `;
const PlanPrice = styled.p` font-size: 2.5rem; font-weight: 800; margin: 0.5rem 0; span { font-size: 1rem; color: #6b7280; font-weight: 400; }`;
const FeatureList = styled.ul` list-style: '✓'; padding-left: 1.5rem; flex-grow: 1; margin: 2rem 0; `;
const FeatureItem = styled.li` margin-bottom: 1rem; color: #374151; `;
const StyledButton = styled.button`
  display: block; width: 100%; text-align: center; text-decoration: none;
  font-weight: 600; padding: 14px 28px; border-radius: 12px; margin-top: auto;
  border: none;
  background: ${({ featured }) => (featured ? '#D45398' : '#A855F7')};
  color: #FFFFFF; cursor: pointer; transition: all 0.2s ease;
  &:hover { opacity: 0.9; transform: scale(1.02); }
`;
const PopularBadge = styled.div`
  position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
  background: #D45398; color: white; padding: 5px 15px; border-radius: 20px;
  font-size: 0.8rem; font-weight: bold;
`;

const PricingPage = () => {
  const navigate = useNavigate();
  const handleChoosePlan = (planCode, price) => navigate(`/payment?plan=${planCode}&price=${price}`);

  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>選擇您的專屬保護方案</Title>
            <Subtitle>您購買的不僅是服務，更是永久的數位資產權。年繳方案僅需支付 10 個月費用，立即享有折扣。</Subtitle>
          </Header>
          <PricingGrid>
            <Card>
              <PlanName>CREATOR<br/>守護者方案</PlanName>
              <PlanPrice>NT$ 390<span> / 月</span></PlanPrice>
              <FeatureList>
                <FeatureItem><strong>100</strong> 件作品永久存證席位</FeatureItem>
                <FeatureItem>每月 <strong>10</strong> 次 AI 掃描額度</FeatureItem>
                <FeatureItem>每週自動巡檢</FeatureItem>
                <FeatureItem>每月 <strong>1</strong> 次 DMCA 下架額度</FeatureItem>
                <FeatureItem>✓ 完整侵權報告</FeatureItem>
              </FeatureList>
              <StyledButton onClick={() => handleChoosePlan('CREATOR', 390)}>選擇此方案</StyledButton>
            </Card>
            <Card>
              <PlanName>CREATOR+<br/>進階守護者 (誘餌)</PlanName>
              <PlanPrice>NT$ 990<span> / 月</span></PlanPrice>
              <FeatureList>
                <FeatureItem><strong>300</strong> 件作品永久存證席位</FeatureItem>
                <FeatureItem>每月 <strong>30</strong> 次 AI 掃描額度</FeatureItem>
                <FeatureItem>每週自動巡檢</FeatureItem>
                <FeatureItem>每月 <strong>3</strong> 次 DMCA 下架額度</FeatureItem>
                <FeatureItem>✓ 完整侵權報告</FeatureItem>
              </FeatureList>
              <StyledButton onClick={() => handleChoosePlan('CREATOR_PLUS', 990)}>選擇此方案</StyledButton>
            </Card>
            <Card featured>
              <PopularBadge>最受歡迎</PopularBadge>
              <PlanName>PROFESSIONAL<br/>捍衛者方案</PlanName>
              <PlanPrice>NT$ 1,490<span> / 月</span></PlanPrice>
              <FeatureList>
                <FeatureItem><strong>500</strong> 件作品永久存證席位</FeatureItem>
                <FeatureItem>每月 <strong>50</strong> 次 AI 掃描額度</FeatureItem>
                <FeatureItem><strong>每日優先掃描</strong></FeatureItem>
                <FeatureItem>每月 <strong>5</strong> 次 DMCA 下架額度</FeatureItem>
                <FeatureItem>✓ **啟動 P2P 變現引擎**</FeatureItem>
                <FeatureItem>✓ 批量處理工具</FeatureItem>
                <FeatureItem>✓ 商標監測功能</FeatureItem>
                <FeatureItem>✓ Email 法律諮詢</FeatureItem>
              </FeatureList>
              <StyledButton featured onClick={() => handleChoosePlan('PROFESSIONAL', 1490)}>升級捍衛者方案</StyledButton>
            </Card>
          </PricingGrid>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};
export default PricingPage;
