import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageSpacer = styled.div`
  min-height: 74px; /* Matches header height */
`;

const HeroWrapper = styled.section`
  background-color: #F8F8F8;
  padding: 80px 32px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #EAEAEA;
`;

const HeroContainer = styled.div`
  max-width: 808px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
`;

const HeroTitle = styled.h1`
  font-size: 56px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -2px;
  color: #0A0101;
  animation: ${fadeInUp} 0.8s ease-out;

  @media (max-width: 899.95px) {
    font-size: 48px;
  }
  @media (max-width: 599.95px) {
    font-size: 32px;
  }
`;

const HeroSubtitle = styled.h3`
  font-size: 22px;
  font-weight: 500;
  line-height: 1.4;
  color: #555;
  max-width: 704px;
`;

const CtaGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

const PrimaryButton = styled(Link)`
  text-decoration: none;
  font-weight: 600;
  padding: 14px 28px;
  border-radius: 12px;
  border: 1px solid #D45398;
  background: #EBB0CF;
  color: #0A0101;
  box-shadow: 2px 2px 0px #D45398;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-size: 1.1rem;

  &:hover {
    box-shadow: 4px 4px 0px #D45398;
    transform: translate(-2px, -2px);
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 32px;
  background: white;
`;

const SectionTitle = styled.h2`
    text-align: center;
    margin-bottom: 50px;
    font-size: 2.5rem;
    color: #0A0101;
`;

const FeaturesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
`;

const FeatureCard = styled.div`
  text-align: center;
  padding: 30px;
  border-radius: 16px;
  background: #F8F8F8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #EAEAEA;
`;

const FeatureTitle = styled.h3`
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 10px;
`;

const FeatureText = styled.p`
    color: #666;
    line-height: 1.6;
`;

const HomePage = () => {
  return (
    <>
      <PageSpacer />
      <HeroWrapper>
        <HeroContainer>
          <HeroTitle>保護您的創意資產，免於數位侵權的威脅</HeroTitle>
          <HeroSubtitle>
            利用 AI 全網掃描與區塊鏈存證技術，SUZOO IP Guard 提供最強大的智慧財產權保護。立即上傳您的作品，啟動全方位的防護網。
          </HeroSubtitle>
          <CtaGroup>
            {/* [★★ 關鍵修正 ★★] 這個按鈕現在會連結到 /protect/step1 */}
            <PrimaryButton to="/protect/step1">立即開始保護</PrimaryButton>
          </CtaGroup>
        </HeroContainer>
      </HeroWrapper>
      <FeaturesSection>
        <SectionTitle>強大功能，全面保護</SectionTitle>
        <FeaturesContainer>
          <FeatureCard>
            <FeatureTitle>AI 全網掃描</FeatureTitle>
            <FeatureText>24小時自動監控各大社群媒體與網站的侵權行為，第一時間發現盜用。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>區塊鏈存證</FeatureTitle>
            <FeatureText>為您的每一份創作生成不可篡改的時間戳記與數位指紋，提供最強法律效力。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>一鍵維權</FeatureTitle>
            <FeatureText>整合 DMCA 申訴流程，只需一鍵即可對侵權平台發出正式下架通知。</FeatureText>
          </FeatureCard>
        </FeaturesContainer>
      </FeaturesSection>
    </>
  );
};

export default HomePage;
