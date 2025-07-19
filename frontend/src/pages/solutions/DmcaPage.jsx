import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PageSpacer = styled.div`min-height: 74px;`;
const HeroSection = styled.section`
  padding: 80px 32px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  text-align: center;
`;
const ContentContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;
const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #1F2937;
`;
const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #4B5563;
  margin-top: 1rem;
`;
const CtaButton = styled(Link)`
  display: inline-block;
  margin-top: 2rem;
  padding: 14px 28px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #FFFFFF;
  background-color: #D45398;
  border-radius: 12px;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(212, 83, 152, 0.3);
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(212, 83, 152, 0.4);
  }
`;

const FeatureSection = styled.section`
  padding: 80px 32px;
  background: #FFFFFF;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const FeatureCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
`;

const FeatureIcon = styled.div` font-size: 3rem; margin-bottom: 1rem; `;
const FeatureTitle = styled.h3` font-size: 1.5rem; color: #1F2937; `;
const FeatureText = styled.p` color: #6B7280; line-height: 1.6; `;

const DmcaPage = () => {
  return (
    <>
      <PageSpacer />
      <HeroSection>
        <ContentContainer>
          <Title>一鍵 DMCA 申訴：高效維權，無需等待</Title>
          <Subtitle>
            發現侵權後不再需要繁瑣的流程。我們整合了 DMCA.com 官方 API，讓您一鍵即可對全球侵權平台發出正式下架通知，高效維護您的合法權益。
          </Subtitle>
          <CtaButton to="/register">註冊帳號，啟用一鍵申訴</CtaButton>
        </ContentContainer>
      </HeroSection>
      <FeatureSection>
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>🚀</FeatureIcon>
            <FeatureTitle>流程極簡化</FeatureTitle>
            <FeatureText>從 AI 偵測到侵權報告，再到點擊申訴按鈕，整個流程在我們的平台上一氣呵成，為您省下寶貴的時間與精力。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>🏛️</FeatureIcon>
            <FeatureTitle>官方 API 整合</FeatureTitle>
            <FeatureText>我們直接對接 DMCA.com 的權威服務，確保您的每一次申訴都符合國際法律規範，最大化下架成功率。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>📈</FeatureIcon>
            <FeatureTitle>進度追蹤</FeatureTitle>
            <FeatureText>在您的會員儀表板中，可以清楚追蹤每一宗申訴案件的處理狀態，所有維權進度一目了然。</FeatureText>
          </FeatureCard>
        </FeatureGrid>
      </FeatureSection>
    </>
  );
};

export default DmcaPage;
