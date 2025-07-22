import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
// 移除了 FileUploadSection 和 ConsoleStatus 的導入，因為此頁面不需要它們

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
  transition: box-shadow 0.2s ease;
  &:hover {
    border-color: #D45398;
    box-shadow: 0 2px 8px rgba(212, 83, 152, 0.1);
  }
`;

const AccordionHeader = styled.button`
  width: 100%;
  background: #FFFFFF;
  border: none;
  padding: 1rem;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  color: #FF8C00;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #FEF6FB; 
  }
`;

const AccordionContent = styled.div`
  padding: 0 1rem 1rem 1rem;
  font-size: 0.95rem;
  line-height: 1.7;
  color: #FF8C00;
  p strong {
      color: #D45398;
  }
`;

const FinalCTASection = styled(HeroWrapper)`
  background-color: #EBB0CF;
`;

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
            <FeatureText>面對全網的**盜圖**、**盜影片**與**盜版**內容，我們的 AI 引擎提供 24/7 **侵權偵測**。不僅揪出侵權，更能有效**防詐騙濫用**，保護您的品牌形象與數位資產安全。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>區塊鏈存證</FeatureTitle>
            <FeatureText>您的每一份創作，上傳瞬間即生成不可篡改的數位指紋，永久記錄於區塊鏈。這份鐵證是您最強大的法律後盾，確保您的原創性無可辯駁。</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>一鍵維權申訴</FeatureTitle>
            <FeatureText>從發現侵權到法律行動，我們提供真正的**一條龍服務**。整合官方 API，您只需**一鍵即可發動 DMCA 申訴**，要求各大平台將侵權內容下架，流程高效且簡單。</FeatureText>
          </FeatureCard>
        </FeaturesContainer>
      </FeaturesSection>

      <LegalSection>
        <SectionTitle>全球法律效力與信任</SectionTitle>
        <TwoColGrid>
          <InfoCard>
            <h3 style={{ color: '#D45398' }}>Our Global Company</h3>
            <p>
              <strong>🇹🇼Epic Global International Co., Ltd.</strong> <br />
              凱盾全球國際股份有限公司 (Seychelles-registered) <br /><br />
              Operating Headquarters: Taipei, Taiwan.<br />
              Global Incorporation: Republic of Seychelles (UN member).
            </p>
          </InfoCard>
          <InfoCard>
            <Accordion title="全球法律效力 (伯恩公約, WTO/TRIPS)">
              <p>我們在聯合國成員國塞席爾的註冊，確保了系統生成的**原創證明文件具有國際效力**。依據《伯恩公約》與 WTO/TRIPS 協定，這份基於區塊鏈的證據在全球主要國家均具法律上的參考價值，無論侵權者身在何處，您都擁有強大的法律基礎來主張權利，建立無可撼動的**信任感**。</p>
            </Accordion>
            <Accordion title="法庭級證據與訴訟效益">
              <p>區塊鏈的不可篡改與精確時間戳特性，使其存證記錄可作為強而有力的**法庭證據**。當面臨法律爭議時，您無需再耗費大量成本去證明創作時間。這份清晰的證據鏈能大幅**提高訴訟經濟效益**，減少舉證困難，讓您在法律程序中佔據絕對優勢，有效嚇阻未來的侵權行為。</p>
            </Accordion>
          </InfoCard>
        </TwoColGrid>
      </LegalSection>

        <FinalCTASection>
          <HeroContainer>
            <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>準備好感受無懈可擊的保護了嗎？</h2>
            <p style={{ maxWidth: '600px', lineHeight: '1.6', fontSize: '1.1rem' }}>查看我們的彈性方案，無論您是個人創作者還是大型企業，都能找到最適合您的保護計畫。</p>
            <PrimaryButton to="/pricing">查看方案與價格</PrimaryButton>
          </HeroContainer>
        </FinalCTASection>

        {/* ★★★ 關鍵修正：已將以下兩個多餘的元件移除 ★★★ */}
        {/* <FileUploadSection /> */}
        {/* <ConsoleStatus /> */}
      </>
    );
  };

export default HomePage;
