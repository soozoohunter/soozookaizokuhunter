import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

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
  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>方案與定價</Title>
            <Subtitle>
              透過我們獨家的<strong>區塊鏈 + AI 侵權偵測</strong>系統，輕鬆保護您的著作權與商標，並在您最需要時獲得法律支援。
            </Subtitle>
          </Header>

          {/* Subscription Plans */}
          <Section>
            <SectionTitle>訂閱方案</SectionTitle>
            <SectionDescription>
              選擇月付或年付訂閱，持續享有區塊鏈認證與 AI 侵權偵測服務。
            </SectionDescription>
            <PricingGrid>
              <Card>
                <PlanName>BASIC</PlanName>
                <PlanPrice>NT$490 / 月</PlanPrice>
                <FeatureList>
                  <FeatureItem>共 3 支影片、5 張圖片保護額度</FeatureItem>
                  <FeatureItem>24 小時侵權偵測</FeatureItem>
                  <FeatureItem>區塊鏈證書 (無限下載)</FeatureItem>
                  <FeatureItem>每月 1 次免費 DMCA 下架</FeatureItem>
                </FeatureList>
                <PlanRemark>適合初階創作者 / 部落客</PlanRemark>
                <StyledButton to="/register">選擇 Basic</StyledButton>
              </Card>
              <Card>
                <PlanName>PRO</PlanName>
                <PlanPrice>NT$1,290 / 月</PlanPrice>
                <FeatureList>
                  <FeatureItem>共 10 支影片、30 張圖片保護額度</FeatureItem>
                  <FeatureItem>優先 AI 掃描 (每日)</FeatureItem>
                  <FeatureItem>無限區塊鏈證書</FeatureItem>
                  <FeatureItem>每月 3 次免費 DMCA 下架</FeatureItem>
                  <FeatureItem>基本法律諮詢 (Email)</FeatureItem>
                </FeatureList>
                <PlanRemark>適合專業影音工作室 / 插畫師</PlanRemark>
                <StyledButton to="/register" primary>選擇 Pro</StyledButton>
              </Card>
              <Card>
                <PlanName>ENTERPRISE</PlanName>
                <PlanPrice>NT$3,990 / 月</PlanPrice>
                <FeatureList>
                  <FeatureItem>無限影片與圖片保護</FeatureItem>
                  <FeatureItem>即時 AI 掃描</FeatureItem>
                  <FeatureItem>無限 DMCA 下架</FeatureItem>
                  <FeatureItem>進階法律涵蓋 (內部法務)</FeatureItem>
                  <FeatureItem>團隊協作 (含 5 個席位)</FeatureItem>
                </FeatureList>
                <PlanRemark>適合企業、大型媒體集團</PlanRemark>
                <StyledButton to="/contact">聯繫我們</StyledButton>
              </Card>
            </PricingGrid>
          </Section>

          {/* Flexible Pay-Per-Feature */}
          <Section>
            <SectionTitle>彈性功能付費</SectionTitle>
            <SectionDescription>
              不想訂閱？先免費上傳與掃描，再依需求單次購買功能即可。
            </SectionDescription>
            <PricingGrid>
               <Card>
                <PlanName>證書下載</PlanName>
                <PlanPrice>NT$99 / 次</PlanPrice>
                <FeatureList>
                  <FeatureItem>生成 PDF 原創證明書</FeatureItem>
                  <FeatureItem>包含區塊鏈時間戳與雜湊值</FeatureItem>
                  <FeatureItem>即時下載永久保存</FeatureItem>
                </FeatureList>
                <StyledButton to="/protect/step1">立即試用</StyledButton>
              </Card>
              <Card>
                <PlanName>侵權掃描</PlanName>
                <PlanPrice>NT$99 / 次</PlanPrice>
                <FeatureList>
                  <FeatureItem>AI 驅動的圖像比對搜尋</FeatureItem>
                  <FeatureItem>識別潛在的侵權來源</FeatureItem>
                  <FeatureItem>每次掃描單次付費</FeatureItem>
                </FeatureList>
                <StyledButton to="/protect/step1">立即試用</StyledButton>
              </Card>
              <Card>
                <PlanName>DMCA 下架申訴</PlanName>
                <PlanPrice>NT$299 / 案</PlanPrice>
                <FeatureList>
                  <FeatureItem>官方 DMCA 下架流程</FeatureItem>
                  <FeatureItem>加速內容移除</FeatureItem>
                  <FeatureItem>每案單次付費</FeatureItem>
                </FeatureList>
                <StyledButton to="/protect/step1">立即試用</StyledButton>
              </Card>
            </PricingGrid>
          </Section>

        </ContentContainer>
      </PageWrapper>
    </>
  );
};

export default PricingPage;
