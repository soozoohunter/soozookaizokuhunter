import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const PageSpacer = styled.div` min-height: 74px; `;
const PageWrapper = styled.div` padding: 4rem 2rem; background-color: #f9fafb; `;
const ContentContainer = styled.div` max-width: 1200px; margin: 0 auto; text-align: center; `;
const Header = styled.header` margin-bottom: 4rem; `;
const Title = styled.h1` font-size: 3rem; font-weight: 800; margin-bottom: 1rem; `;
const Subtitle = styled.p` font-size: 1.25rem; color: #6b7280; max-width: 700px; margin: 0 auto; line-height: 1.6; `;

const Section = styled.section` margin: 3rem 0; text-align: left; `;
const SectionTitle = styled.h2` font-size: 2rem; margin-bottom: 1rem; color: #D45398; `;
const CTASection = styled.div`
  background: #EBB0CF;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  margin-top: 2rem;
`;
const PrimaryButton = styled.button`
  margin-top: 1rem;
  padding: 14px 28px;
  font-weight: 600;
  border: none;
  background: #D45398;
  color: #FFFFFF;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { opacity: 0.9; transform: scale(1.03); }
`;

const GlobalCoveragePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>全球覆蓋巡邏網：讓侵權無所遁形</Title>
            <Subtitle>在網路世界，地理疆界已無意義。您的作品可能在下一秒就出現在地球另一端的詐騙網站上。因此，您的保護網也必須是全球級的。</Subtitle>
          </Header>
          <Section>
            <SectionTitle>我們的 AI 哨兵在哪裡巡邏？</SectionTitle>
            <p>SUZOO 的 AI 哨兵部署在全球數千台雲端伺服器上，24/7 不間斷地掃描以下高風險區域：</p>
            <ul>
              <li><strong>主流社群媒體</strong>: Facebook, Instagram, X (Twitter), Pinterest</li>
              <li><strong>影音平台</strong>: YouTube, TikTok, Vimeo</li>
              <li><strong>亞洲主要電商平台</strong>: 蝦皮 (Shopee), 淘寶 (Taobao), MOMO, PChome</li>
              <li><strong>全球獨立電商</strong>: 數以萬計使用 Shopify, WooCommerce 建立的一頁式網站</li>
            </ul>
            <p>我們的監控列表每週都在擴大，確保能覆蓋最新的威脅來源。</p>
          </Section>
          <CTASection>
            <h3>您的創作值得世界級的保護</h3>
            <p>不要讓您的心血結晶，成為您不知道的角落裡，他人獲利的工具。立即部署您的全球 AI 哨兵，將整個網路納入您的保護範圍。</p>
            <PrimaryButton onClick={() => navigate('/pricing')}>查看方案，啟動全球防護</PrimaryButton>
          </CTASection>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};
export default GlobalCoveragePage;
