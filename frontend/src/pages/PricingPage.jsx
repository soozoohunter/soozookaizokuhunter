import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';

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

const Header = styled.header`
  margin-bottom: 4rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.light.text};
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.light.textMuted};
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
`;

const Section = styled.section`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.light.primary};
  border-bottom: 2px solid ${({ theme }) => theme.colors.light.secondary};
  display: inline-block;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
`;

const SectionDescription = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.light.textMuted};
  max-width: 800px;
  margin: 0 auto 2.5rem auto;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  justify-content: center;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.light.card};
  border: 1px solid ${({ theme }) => theme.colors.light.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 2rem;
  display: flex;
  flex-direction: column;
  text-align: left;
  box-shadow: ${({ theme }) => theme.shadows.main};
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.light.primary};
`;

const PlanPrice = styled.p`
  font-size: 2rem;
  font-weight: 800;
  margin: 1rem 0;
`;

const FeatureList = styled.ul`
  list-style: '✓';
  padding-left: 1.5rem;
  flex-grow: 1;
  margin-bottom: 2rem;
`;

const FeatureItem = styled.li`
  margin-bottom: 0.75rem;
`;

const PlanRemark = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.light.textMuted};
  margin-top: auto;
  padding-top: 1rem;
`;

const StyledButton = styled(Link)`
  display: block;
  text-align: center;
  text-decoration: none;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  margin-top: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.light.primary};
  background: ${({ theme, primary }) => (primary ? theme.colors.light.primary : theme.colors.light.background)};
  color: ${({ theme, primary }) => (primary ? '#FFFFFF' : theme.colors.light.primary)};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme, primary }) => (primary ? theme.colors.light.primaryHover : theme.colors.light.secondary)};
  }
`;

const PricingPage = () => {
  const navigate = useNavigate();

  const handleChoosePlan = (planCode, price) => {
    navigate(`/payment?plan=${planCode}&price=${price}`);
  };

  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>方案與定價</Title>
            <Subtitle>
              選擇最適合您的方案。所有方案皆包含我們獨家的<strong>區塊鏈 + AI 侵權偵測</strong>核心技術。
            </Subtitle>
          </Header>

          <Section>
            <SectionTitle>訂閱方案</SectionTitle>
            <SectionDescription>
              年繳方案享有 2 個月免費優惠，是您最划算的選擇。
            </SectionDescription>
            <PricingGrid>
              {/* Free Plan */}
              <Card>
                <PlanName>FREE (永久免費版)</PlanName>
                <PlanPrice>NT$0</PlanPrice>
                <FeatureList>
                  <FeatureItem><strong>5</strong> 件作品永久存證席位</FeatureItem>
                  <FeatureItem>每月 <strong>1</strong> 次 AI 掃描額度</FeatureItem>
                  <FeatureItem>掃描結果摘要報告</FeatureItem>
                  <FeatureItem>無限次證書下載</FeatureItem>
                </FeatureList>
                <StyledButton to="/register">免費註冊</StyledButton>
              </Card>

              {/* Creator Plan */}
              <Card>
                <PlanName>CREATOR (守護者方案)</PlanName>
                <PlanPrice>NT$390 / 月</PlanPrice>
                <FeatureList>
                  <FeatureItem><strong>100</strong> 件作品永久存證席位</FeatureItem>
                  <FeatureItem>每月 <strong>10</strong> 次 AI 掃描額度</FeatureItem>
                  <FeatureItem>每週自動巡檢</FeatureItem>
                  <FeatureItem>每月 <strong>1</strong> 次 DMCA 下架額度</FeatureItem>
                  <FeatureItem>解鎖完整侵權報告</FeatureItem>
                </FeatureList>
                <StyledButton as="button" onClick={() => handleChoosePlan('CREATOR', 390)} primary>
                  選擇 Creator
                </StyledButton>
              </Card>
              {/* Professional Plan */}
              <Card>
                <PlanName>PROFESSIONAL (捍衛者方案)</PlanName>
                <PlanPrice>NT$1,490 / 月</PlanPrice>
                <FeatureList>
                  <FeatureItem><strong>500</strong> 件作品永久存證席位</FeatureItem>
                  <FeatureItem>每月 <strong>50</strong> 次 AI 掃描額度</FeatureItem>
                  <FeatureItem><strong>每日優先掃描</strong></FeatureItem>
                  <FeatureItem>每月 <strong>5</strong> 次 DMCA 下架額度</FeatureItem>
                  <FeatureItem><strong>批量處理工具</strong></FeatureItem>
                  <FeatureItem><strong>商標監測功能</strong></FeatureItem>
                  <FeatureItem>Email 法律諮詢</FeatureItem>
                </FeatureList>
                <StyledButton as="button" onClick={() => handleChoosePlan('PROFESSIONAL', 1490)} primary>
                  選擇 Professional
                </StyledButton>
              </Card>
            </PricingGrid>
          </Section>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};

export default PricingPage;
