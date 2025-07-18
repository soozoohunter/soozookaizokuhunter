import React from 'react';
import styled from 'styled-components';

const PageSpacer = styled.div`
  min-height: 74px;
`;

const PageWrapper = styled.div`
  padding: 4rem 2rem;
  background-color: ${({ theme }) => theme.colors.light.background};
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.light.textMuted};
  max-width: 600px;
  margin: 0 auto 4rem auto;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
`;

const PricingCard = styled.div`
  background: ${({ theme }) => theme.colors.light.card};
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 2rem;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.main};
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
`;

const PlanPrice = styled.p`
  font-size: 2.5rem;
  font-weight: 800;
  margin: 1rem 0;
`;

const FeatureList = styled.ul`
  list-style: '✓';
  padding-left: 1.5rem;
  text-align: left;
  flex-grow: 1;
  margin-bottom: 2rem;
`;

const FeatureItem = styled.li`
  margin-bottom: 0.75rem;
`;

const StyledButton = styled.a`
  text-decoration: none;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.light.primary};
  background: ${({ theme }) => theme.colors.light.secondary};
  color: ${({ theme }) => theme.colors.light.text};
  box-shadow: 2px 2px 0px ${({ theme }) => theme.colors.light.primary};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.light.primary};
    transform: translate(-2px, -2px);
  }
`;

const PricingPage = () => {
  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Title>選擇最適合您的方案</Title>
          <Subtitle>從個人創作者到大型企業，我們都有對應的解決方案來保護您的智慧財產。</Subtitle>
          <PricingGrid>
            <PricingCard>
              <PlanName>Basic</PlanName>
              <PlanPrice>$10/月</PlanPrice>
              <FeatureList>
                <FeatureItem>100 個檔案存證額度</FeatureItem>
                <FeatureItem>每月 200 次 AI 掃描</FeatureItem>
                <FeatureItem>一鍵 DMCA 申訴</FeatureItem>
              </FeatureList>
              <StyledButton href="/register">開始使用</StyledButton>
            </PricingCard>
            <PricingCard>
              <PlanName>Pro</PlanName>
              <PlanPrice>$30/月</PlanPrice>
              <FeatureList>
                <FeatureItem>500 個檔案存證額度</FeatureItem>
                <FeatureItem>每月 1000 次 AI 掃描</FeatureItem>
                <FeatureItem>一鍵 DMCA 申訴</FeatureItem>
                <FeatureItem>優先客戶支援</FeatureItem>
              </FeatureList>
              <StyledButton href="/register">選擇 Pro</StyledButton>
            </PricingCard>
            <PricingCard>
              <PlanName>Enterprise</PlanName>
              <PlanPrice>聯繫我們</PlanPrice>
              <FeatureList>
                <FeatureItem>無限檔案存證額度</FeatureItem>
                <FeatureItem>無限 AI 掃描</FeatureItem>
                <FeatureItem>API 存取權限</FeatureItem>
                <FeatureItem>專屬客戶經理</FeatureItem>
              </FeatureList>
              <StyledButton href="/contact">洽詢方案</StyledButton>
            </PricingCard>
          </PricingGrid>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};

export default PricingPage;
