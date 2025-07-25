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

const SmartMatchingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>智慧指紋比對：看穿侵權者的偽裝</Title>
            <Subtitle>盜圖者最常用的伎倆就是對您的作品進行微調：加上濾鏡、左右翻轉、稍微裁切，試圖躲過傳統的搜尋引擎。我們的智慧比對技術，就是為此而生。</Subtitle>
          </Header>
          <Section>
            <SectionTitle>為何我們能比 Google 更精準？</SectionTitle>
            <p>當您上傳作品時，SUZOO 不僅儲存您的圖片，更會為其計算出一個獨一無二的<strong>「感知雜湊」(Perceptual Hash)</strong>。這就像是作品的 DNA，它記錄的不是像素，而是圖像的結構、比例與色彩分佈。這意味著：</p>
            <ul>
              <li><strong>對抗裁切</strong>: 即使圖片被裁切掉 30%，其核心指紋依然存在。</li>
              <li><strong>無視調色</strong>: 無論是變成黑白、加上 LOMO 濾鏡，都不會影響指紋的比對。</li>
              <li><strong>抵抗翻轉與壓縮</strong>: 圖片被左右翻轉或經過嚴重壓縮，我們的 AI 依然能認出它。</li>
            </ul>
            <p>這項技術讓我們能揪出那些人類肉眼難以分辨、但本質上就是盜用您心血的侵權內容。</p>
          </Section>
          <CTASection>
            <h3>魔高一尺，道高一丈</h3>
            <p>不要讓侵權者的雕蟲小技逍遙法外。立即體驗 SUZOO 的智慧指紋比對技術，讓您的每一份創作都擁有無法被偽裝的數位 DNA。</p>
            <PrimaryButton onClick={() => navigate('/free-trial')}>免費體驗精準偵測</PrimaryButton>
          </CTASection>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};
export default SmartMatchingPage;
