import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PageSpacer = styled.div`
  min-height: 74px; /* Matches header height */
`;

const HeroWrapper = styled.section`
  background-color: #F8F8F8;
  padding: 80px 32px;
  text-align: center;
  border-bottom: 1px solid #EAEAEA;
`;

const HeroContainer = styled.div`
  max-width: 808px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -2px;
  color: #0A0101;
  text-transform: uppercase;

  @media (max-width: 899.95px) { font-size: 2.5rem; }
  @media (max-width: 599.95px) { font-size: 2rem; }
`;

const HeroSubtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
  color: #D45398;
  text-transform: uppercase;
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
  margin-top: 1rem;

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

// [★★ NEW SECTION ★★]
const LegalSection = styled(FeaturesSection)`
  background-color: #F8F8F8;
`;

const TwoColGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background: #FFFFFF;
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid #EAEAEA;
  text-align: left;
`;

const AccordionWrapper = styled.div`
  margin-bottom: 1rem;
  border: 1px solid #EAEAEA;
  border-radius: 8px;
  overflow: hidden;
`;

const AccordionHeader = styled.button`
  width: 100%;
  background: #FFFFFF;
  border: none;
  padding: 1rem;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AccordionContent = styled.div`
  padding: 0 1rem 1rem 1rem;
  font-size: 0.95rem;
  line-height: 1.7;
  color: #555;
`;

const FinalCTASection = styled(HeroWrapper)`
  background-color: #EBB0CF;
`;

// Accordion Component for details
const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <AccordionWrapper>
      <AccordionHeader onClick={() => setIsOpen(!isOpen)}>
        {title}
        <span>{isOpen ? '−' : '+'}</span>
      </AccordionHeader>
      {isOpen && <AccordionContent>{children}</AccordionContent>}
    </AccordionWrapper>
  );
};


const HomePage = () => {
  return (
    <>
      <PageSpacer />
      <HeroWrapper>
        <HeroContainer>
          {/* [★★ CONTENT UPDATE ★★] */}
          <HeroTitle>Blockchain + AI = Flawless Copyright Protection</HeroTitle>
          <HeroSubtitle>One Click to Prove Your Originality.</HeroSubtitle>
          <p style={{ maxWidth: '700px', lineHeight: '1.6', fontSize: '1.1rem' }}>
            <strong>ONLY WE</strong> combine unstoppable <strong>Blockchain Fingerprinting</strong> with advanced <strong>AI Infringement Detection</strong> and global legal solutions, recognized under the <strong>Berne Convention</strong> and <strong>WTO/TRIPS</strong>.
          </p>
          <PrimaryButton to="/protect/step1">立即免費體驗</PrimaryButton>
        </HeroContainer>
      </HeroWrapper>

      <FeaturesSection>
        <SectionTitle>三大核心技術，一站式解決方案</SectionTitle>
        <FeaturesContainer>
          <FeatureCard>
            <FeatureTitle>AI 全網掃描</FeatureTitle>
            <FeatureText>我們強大的 AI 引擎 24/7 不間斷掃描主流社群平台與各大網站，第一時間揪出盜用您珍贵作品的侵權者。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>區塊鏈存證</FeatureTitle>
            <FeatureText>您的每一份创作，都会在上传瞬间生成不可篡改的数位指纹并记录在区块链上，提供最坚实的法律后盾。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>一鍵維權申訴</FeatureTitle>
            <FeatureText>发现侵权？无需繁琐流程。系统整合 DMCA 官方 API，您只需一键即可发出正式下架通知，高效维护您的权益。</FeatureText>
          </FeatureCard>
        </FeaturesContainer>
      </FeaturesSection>

      {/* [★★ NEW SECTION ★★] */}
      <LegalSection>
        <SectionTitle>全球法律效力與信任</SectionTitle>
        <TwoColGrid>
          <InfoCard>
            <h3 style={{ color: '#ffca28' }}>Our Global Company</h3>
            <p>
              <strong>🇹🇼Epic Global International Co., Ltd.</strong> <br />
              凱盾全球國際股份有限公司 (Seychelles-registered) <br /><br />
              Operating Headquarters: Taipei, Taiwan.<br />
              Global Incorporation: Republic of Seychelles (UN member).
            </p>
          </InfoCard>
          <InfoCard>
            <Accordion title="Our Unique Global Service (Bern Convention, TRIPS, WTO)">
              <p>Because Seychelles is a member of the United Nations since 1976, our corporate registration there ensures <strong>global enforceability</strong> of all our certificates. No matter where infringers hide, you have powerful legal grounds to claim your rights.</p>
            </Accordion>
            <Accordion title="Taiwan Copyright & WTO/TRIPS">
              <p>Under <strong>WTO/TRIPS</strong> requirements, Taiwan’s Copyright Act extends to all member economies. This means Taiwanese works gain protection globally. Our blockchain + AI solution fully aligns with these global norms, effectively deterring infringement anywhere in the world!</p>
            </Accordion>
          </InfoCard>
        </TwoColGrid>
      </LegalSection>

      {/* [★★ NEW SECTION ★★] */}
      <FinalCTASection>
        <HeroContainer>
          <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>準備好感受無懈可擊的保護了嗎？</h2>
          <p style={{ maxWidth: '600px', lineHeight: '1.6', fontSize: '1.1rem' }}>查看我們的彈性方案，無論您是個人創作者還是大型企業，都能找到最適合您的保護計畫。</p>
          <PrimaryButton to="/pricing">查看方案與價格</PrimaryButton>
        </HeroContainer>
      </FinalCTASection>
    </>
  );
};

export default HomePage;
