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

const AiSentinelPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>AI 哨兵：您 24/7 的全網監控與蒐證專家</Title>
            <Subtitle>侵權者從不休息，您的保護也不該停歇。SUZOO 的 AI 哨兵是您最忠誠的衛士，它永不眠地巡邏網路，不僅為了發現侵權，更為了在第一時間保全證據。</Subtitle>
          </Header>
          <Section>
            <SectionTitle>AI 哨兵為您做什麼？</SectionTitle>
            <ul>
              <li><strong>全網監控</strong>: 覆蓋全球主流社群媒體、影音平台與數千個電商網站。</li>
              <li><strong>電商防詐</strong>: 特別針對一頁式詐騙網站進行掃描，保護您的商品圖不被濫用，維護您的品牌聲譽。</li>
              <li><strong>鐵證保全</strong>: 這是我們的獨家技術。發現侵權的瞬間，系統會自動對侵權頁面進行<strong>多角度截圖與網頁原始碼存檔</strong>。即使侵權方下架內容，您手中依然握有呈上法庭也無法抵賴的鐵證。</li>
            </ul>
          </Section>
          <CTASection>
            <h3>在侵權者刪除證據前，先發制人。</h3>
            <p>一個沒有持續監控和自動蒐證的存證，就像一把沒有子彈的槍。立即啟用您的 AI 哨兵，讓您的每一份資產都處於全天候的警戒狀態。</p>
            <PrimaryButton onClick={() => navigate('/pricing')}>查看方案，啟用 AI 哨兵</PrimaryButton>
          </CTASection>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};
export default AiSentinelPage;
