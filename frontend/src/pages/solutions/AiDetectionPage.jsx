import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PageSpacer = styled.div` min-height: 74px; `;
const PageWrapper = styled.div` padding: 4rem 2rem; background-color: #f9fafb; `;
const ContentContainer = styled.div` max-width: 1200px; margin: 0 auto; text-align: center; `;
const Header = styled.header` margin-bottom: 4rem; `;
const Title = styled.h1` font-size: 3rem; font-weight: 800; margin-bottom: 1rem; `;
const Subtitle = styled.p` font-size: 1.25rem; color: #6b7280; max-width: 700px; margin: 0 auto; line-height: 1.6; `;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;
`;

const FeatureCard = styled(Link)`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  text-align: center;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    border-color: #D45398;
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.5rem;
`;

const FeatureTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
`;

const FeatureDescription = styled.p`
  color: #374151;
  line-height: 1.7;
`;

const AiDetectionPage = () => {
  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>AI 哨兵：您的 24/7 全網保護神</Title>
            <Subtitle>我們的 AI 侵權偵測系統，不僅是一個工具，更是您在數位世界中不眠不休的忠誠衛士。探索其三大核心能力，了解我們如何為您的創作建立起堅不可摧的防線。</Subtitle>
          </Header>
          <FeaturesGrid>
            <FeatureCard to="/solutions/global-coverage">
              <FeatureIcon>🌐</FeatureIcon>
              <FeatureTitle>全球覆蓋巡邏網</FeatureTitle>
              <FeatureDescription>深入掃描 Facebook, Instagram, YouTube, TikTok 及各大電商網站，全面防堵盜版內容，有效防範您的品牌形象被詐騙集團濫用。</FeatureDescription>
            </FeatureCard>
            <FeatureCard to="/solutions/smart-matching">
              <FeatureIcon>💡</FeatureIcon>
              <FeatureTitle>智慧指紋比對技術</FeatureTitle>
              <FeatureDescription>不僅僅是關鍵字。我們的 AI 採用先進的圖像與影片指紋比對技術，即使作品被裁切、調色或修改，也能精準識別。</FeatureDescription>
            </FeatureCard>
            <FeatureCard to="/solutions/realtime-alerts">
              <FeatureIcon>🔔</FeatureIcon>
              <FeatureTitle>即時威脅警報系統</FeatureTitle>
              <FeatureDescription>一旦發現疑似侵權內容，系統將第一時間透過儀表板與 Email 通知您，讓您即時掌握狀況，在損害擴大前採取行動。</FeatureDescription>
            </FeatureCard>
          </FeaturesGrid>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};

export default AiDetectionPage;
