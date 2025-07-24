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

const P2pEnginePage = () => {
  const navigate = useNavigate();
  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>P2P 變現引擎：化憤怒為收益</Title>
            <Subtitle>發現侵權不再只有無奈與憤怒。SUZOO 革命性的 P2P 變現引擎，將您的著作權利，從一項法律權益，升級為一項可交易、可獲利的金融資產。</Subtitle>
          </Header>
          <Section>
            <SectionTitle>P2P 變現引擎如何運作？</SectionTitle>
            <p>當 AI 哨兵發現侵權時，您可以一鍵啟動 P2P 引擎。系統會為您自動生成一個具備法律壓力的「侵權解決頁面」，並提供一個專屬連結讓您發送給侵權方。此頁面將以您的名義，向對方提出兩個選擇：</p>
            <ol>
              <li><strong>商業和解</strong>: 支付一筆合理的授權費，立即將侵權行為合法化，案件和平關閉。</li>
              <li><strong>法律程序</strong>: 面對基於區塊鏈鐵證的 DMCA 下架申訴與後續法律追訴。</li>
            </ol>
            <p>我們將法律的威懾力，轉化為您與侵權方之間的商業談判籌碼，讓您佔據絕對主動權。</p>
          </Section>
          <CTASection>
            <h3>您的每一次創作，都應有價。</h3>
            <p>不要再讓侵權者零成本地竊取您的心血。立即升級您的方案，啟動 P2P 變現引擎，開始將您的權利轉化為實際收益。</p>
            <PrimaryButton onClick={() => navigate('/pricing')}>查看方案，啟動您的變現引擎</PrimaryButton>
          </CTASection>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};
export default P2pEnginePage;
