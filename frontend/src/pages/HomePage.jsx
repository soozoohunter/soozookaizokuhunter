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
          <HeroTitle>不只保護，更能變現</HeroTitle>
          <HeroSubtitle>全球首創 P2P 侵權變現引擎，為您的原創著作才華賦予經濟價值</HeroSubtitle>
            <p style={{ maxWidth: '700px', lineHeight: '1.6', fontSize: '1.1rem' }}>
              我們整合不可篡改的區塊鏈技術與 24/7 AI 全網監控，不僅為您的創作鑄造神聖不可侵犯的數位權狀，更能將每一次侵權，都轉化為一次商業談判的機會，將您的權利變為實際收益。
            </p>
          <PrimaryButton to="/free-trial">免費取得您的第一份區塊鏈權狀</PrimaryButton>
        </HeroContainer>
      </HeroWrapper>

      <FeaturesSection>
        <SectionTitle>您的三大權利引擎</SectionTitle>
        <FeaturesContainer>
          {/* 新增 Link 使卡片可點擊 */}
          <Link to="/solutions/blockchain-deed" style={{ textDecoration: 'none' }}>
            <FeatureCard>
              <FeatureTitle>區塊鏈權狀</FeatureTitle>
              <FeatureText>告別傳統存證的繁瑣與不確定性。您的每件作品上傳即生成一份永久的、具備全球法律效力的數位產權證明。它不是收據，而是您在數位世界中神聖不可侵犯的權狀。</FeatureText>
            </FeatureCard>
          </Link>

          <Link to="/solutions/ai-sentinel" style={{ textDecoration: 'none' }}>
            <FeatureCard>
              <FeatureTitle>AI 哨兵</FeatureTitle>
              <FeatureText>
                全網監控：我們的 AI 哨兵 24/7 不間斷巡邏全球網路，從台灣各大電商平台到 Facebook、Instagram、TikTok 及 YouTube，滴水不漏。<br />
                電商防詐：主動掃描並識別盜用您商品圖的詐騙網站與一頁式廣告，保護您的品牌商譽與客戶信任。<br />
                鐵證保全：一旦發現侵權，系統將自動抓取並儲存侵權頁面的截圖與內容。即使對方刪文下架，您手中仍握有無法抵賴的侵權證據，確保您在法律程序中立於不敗之地。
              </FeatureText>
            </FeatureCard>
          </Link>

          <Link to="/solutions/p2p-engine" style={{ textDecoration: 'none' }}>
            <FeatureCard>
              <FeatureTitle>P2P 變現引擎</FeatureTitle>
              <FeatureText>
                化憤怒為收益：一鍵啟動 P2P 變現引擎，自動生成具備法律壓力的「侵權解決頁面」，讓侵權方在「付費取得合法授權」與「面臨法律追訴」之間做出理性選擇。<br />
                快速下架：對於惡意侵權，可直接發動 DMCA 申訴，整合官方 API，最快 24 小時內將侵權內容從主流平台下架。<br />
                法律支援：所有存證、掃描紀錄與侵權證據都可一鍵匯出，作為提交給律師或法院的專業報告，大幅簡化您的訴訟流程。
              </FeatureText>
            </FeatureCard>
          </Link>
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
