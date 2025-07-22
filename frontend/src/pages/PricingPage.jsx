import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';

const PageSpacer = styled.div` min-height: 74px; `;
const PageWrapper = styled.div` padding: 4rem 2rem; background-color: #f9fafb; `;
const ContentContainer = styled.div` max-width: 1200px; margin: 0 auto; text-align: center; `;
const Header = styled.header` margin-bottom: 4rem; `;
const Title = styled.h1` font-size: 3rem; font-weight: 800; margin-bottom: 1rem; `;
const Subtitle = styled.p` font-size: 1.25rem; color: #6b7280; max-width: 700px; margin: 0 auto; line-height: 1.6; `;
const Section = styled.section` margin-bottom: 3rem; `;
const SectionTitle = styled.h2` font-size: 2rem; font-weight: 700; margin-bottom: 1rem; `;
const SectionDescription = styled.p` font-size: 1rem; color: #6b7280; margin-bottom: 2rem; `;
const PricingGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; align-items: stretch; @media(max-width: 992px) { grid-template-columns: 1fr; }`;
const Card = styled.div`
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; text-align: left;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
`;
const PlanName = styled.h3` font-size: 1.5rem; font-weight: 700; color: #111827; `;
const PlanPrice = styled.p` font-size: 2.5rem; font-weight: 800; margin: 0.5rem 0; `;
const FeatureList = styled.ul` list-style: '✓'; padding-left: 1.5rem; flex-grow: 1; margin: 2rem 0; `;
const FeatureItem = styled.li` margin-bottom: 1rem; color: #374151; `;
const PlanRemark = styled.p` margin-top: auto; color: #6b7280; font-size: 0.9rem; `;
const StyledButton = styled(Link)`
  display: block; width: 100%; text-align: center; text-decoration: none;
  font-weight: 600; padding: 14px 28px; border-radius: 12px; margin-top: 1rem;
  background: #A855F7; color: #FFFFFF; cursor: pointer; transition: all 0.2s ease;
  &:hover { opacity: 0.9; transform: scale(1.02); }
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
              {/* --- Free Plan --- */}
              <Card>
                <PlanName>FREE</PlanName>
                <PlanPrice>NT$0</PlanPrice>
                <FeatureList>
                  <FeatureItem><strong>5</strong> 件作品永久區塊鏈存證</FeatureItem>
                  <FeatureItem>每月 <strong>1</strong> 次免費 AI 掃描</FeatureItem>
                  <FeatureItem>掃描結果摘要報告</FeatureItem>
                  <FeatureItem>✓ 無限次證書下載</FeatureItem>
                </FeatureList>
                <PlanRemark>適合剛起步，想體驗核心功能的您</PlanRemark>
                <StyledButton to="/register">免費註冊</StyledButton>
              </Card>

              {/* --- Creator Plan --- */}
              <Card>
                <PlanName>CREATOR</PlanName>
                <PlanPrice>NT$390 / 月</PlanPrice>
                <FeatureList>
                  <FeatureItem><strong>100</strong> 件作品永久區塊鏈存證</FeatureItem>
                  <FeatureItem>每月 <strong>10</strong> 次 AI 掃描</FeatureItem>
                  <FeatureItem><strong>解鎖完整侵權報告</strong></FeatureItem>
                  <FeatureItem>每月 <strong>1</strong> 次免費 DMCA 下架</FeatureItem>
                </FeatureList>
                <PlanRemark>適合個人創作者、攝影師、部落客</PlanRemark>
                <StyledButton as="button" onClick={() => handleChoosePlan('CREATOR', 390)} primary>
                  選擇 Creator
                </StyledButton>
              </Card>

              {/* --- Professional Plan --- */}
              <Card>
                <PlanName>PROFESSIONAL</PlanName>
                <PlanPrice>NT$1,490 / 月</PlanPrice>
                <FeatureList>
                  <FeatureItem><strong>500</strong> 件作品永久區塊鏈存證</FeatureItem>
                  <FeatureItem>每月 <strong>50</strong> 次 AI 掃描</FeatureItem>
                  <FeatureItem><strong>批量上傳 & 批量掃描</strong></FeatureItem>
                  <FeatureItem>每月 <strong>5</strong> 次免費 DMCA 下架</FeatureItem>
                  <FeatureItem>Email 法律諮詢支援</FeatureItem>
                </FeatureList>
                <PlanRemark>適合專業工作室、設計師、YouTuber</PlanRemark>
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
