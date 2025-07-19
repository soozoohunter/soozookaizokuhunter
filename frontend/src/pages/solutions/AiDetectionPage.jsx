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

const AiDetectionPage = () => {
  return (
    <>
      <PageSpacer />
      <HeroSection>
        <ContentContainer>
          <Title>AI 全網侵權偵測：您的 24/7 數位守護者</Title>
          <Subtitle>
            我們的 AI 引擎永不休息，持續掃描全球主流社群平台與各大網站，自動揪出盜用您珍貴作品的盜圖、盜影片行為，讓侵權無所遁形。
          </Subtitle>
          <CtaButton to="/protect/step1">立即免費體驗 AI 偵測</CtaButton>
        </ContentContainer>
      </HeroSection>
      <FeatureSection>
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>🌐</FeatureIcon>
            <FeatureTitle>全球覆蓋</FeatureTitle>
            <FeatureText>深入掃描 Facebook, Instagram, YouTube, TikTok 及各大電商網站，全面防堵盜版內容，有效防範品牌形象被詐騙集團濫用。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>💡</FeatureIcon>
            <FeatureTitle>智慧比對技術</FeatureTitle>
            <FeatureText>不僅僅是關鍵字，我們的 AI 採用先進的圖像與影片指紋比對技術，即使作品被裁切、調色或修改，也能精準識別。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>🔔</FeatureIcon>
            <FeatureTitle>即時警報系統</FeatureTitle>
            <FeatureText>一旦發現疑似侵權內容，系統將第一時間透過儀表板與 Email 通知您，讓您即時掌握狀況，採取行動。</FeatureText>
          </FeatureCard>
        </FeatureGrid>
      </FeatureSection>
    </>
  );
};

export default AiDetectionPage;
