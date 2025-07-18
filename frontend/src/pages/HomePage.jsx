import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PageSpacer = styled.div`
  min-height: 74px; /* Matches header height */
`;

const HeroWrapper = styled.section`
  background-color: #F8F8F8;
  padding: 72px 32px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HeroContainer = styled.div`
  max-width: 808px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
`;

const HeroTitle = styled.h1`
  font-size: 64px;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -2.16px;
  color: #0A0101;
  animation: fadeInUp 0.8s ease-out;

  @media (max-width: 899.95px) {
    font-size: 48px;
  }
  @media (max-width: 599.95px) {
    font-size: 32px;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const HeroSubtitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
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
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid #D45398;
  background: #EBB0CF;
  color: #0A0101;
  box-shadow: 2px 2px 0px #D45398;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    box-shadow: 4px 4px 0px #D45398;
    transform: translateY(-3px);
  }
`;

const SecondaryButton = styled(Link)`
  text-decoration: none;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid #0A0101;
  background: #FFFFFF;
  color: #0A0101;
  box-shadow: 2px 2px 0px #0A0101;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 4px 4px 0px #0A0101;
    transform: translate(-2px, -2px);
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 32px;
  background: white;
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
            <PrimaryButton to="/register">立即開始保護</PrimaryButton>
            <SecondaryButton to="/pricing">查看方案</SecondaryButton>
          </CtaGroup>
        </HeroContainer>
      </HeroWrapper>
      <FeaturesSection>
        <h2 style={{ textAlign: 'center', marginBottom: '50px' }}>強大功能，全面保護</h2>
        <FeaturesContainer>
          <FeatureCard>
            <h3>AI 全網掃描</h3>
            <p>24小時自動監控網路侵權行為</p>
          </FeatureCard>
          <FeatureCard>
            <h3>區塊鏈存證</h3>
            <p>不可篡改的創作時間證明</p>
          </FeatureCard>
          <FeatureCard>
            <h3>一鍵維權</h3>
            <p>自動化侵權通知與下架流程</p>
          </FeatureCard>
        </FeaturesContainer>
      </FeaturesSection>
      {/* You can add more sections to your homepage here */}
    </>
  );
};

export default HomePage;
