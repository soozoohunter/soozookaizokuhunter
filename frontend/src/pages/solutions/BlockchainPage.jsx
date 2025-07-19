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

const BlockchainPage = () => {
  return (
    <>
      <PageSpacer />
      <HeroSection>
        <ContentContainer>
          <Title>區塊鏈存證：給您無法篡改的法庭級證據</Title>
          <Subtitle>
            在您上傳作品的瞬間，我們為其生成獨一無二的數位指紋，並將其永久記錄在區塊鏈上。這份帶有時間戳的證明，是您在全球法庭上主張權利的最強武器。
          </Subtitle>
          <CtaButton to="/protect/step1">立即產生您的第一個存證</CtaButton>
        </ContentContainer>
      </HeroSection>
      <FeatureSection>
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>🛡️</FeatureIcon>
            <FeatureTitle>不可篡改</FeatureTitle>
            <FeatureText>一旦寫入區塊鏈，任何人，包括我們自己，都無法修改或刪除您的存證紀錄，確保證據的絕對公正性。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>⚖️</FeatureIcon>
            <FeatureTitle>國際法律效力</FeatureTitle>
            <FeatureText>我們的服務符合國際標準，生成的原創證明文件在全球多數國家具有法律參考價值，大幅提高訴訟經濟效益。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>📄</FeatureIcon>
            <FeatureTitle>一鍵生成證明書</FeatureTitle>
            <FeatureText>隨時可從您的儀表板下載包含所有關鍵存證資訊的 PDF 證明書，方便您提交給法律單位或合作夥伴。</FeatureText>
          </FeatureCard>
        </FeatureGrid>
      </FeatureSection>
    </>
  );
};

export default BlockchainPage;
