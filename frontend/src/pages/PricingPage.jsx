import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const PageSpacer = styled.div` min-height: 74px; `;
const PageWrapper = styled.div`
  padding: 4rem 2rem;
  background: linear-gradient(to bottom, #f0f7ff, #ffffff);
`;
const ContentContainer = styled.div` max-width: 1200px; margin: 0 auto; text-align: center; `;
const Header = styled.header` margin-bottom: 4rem; `;
const Title = styled.h1` font-size: 3rem; font-weight: 800; margin-bottom: 1rem; `;
const Subtitle = styled.p` font-size: 1.25rem; color: #6b7280; max-width: 700px; margin: 0 auto; line-height: 1.6; `;
const PricingGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; align-items: stretch; @media(max-width: 992px) { grid-template-columns: 1fr; }`;
const Card = styled.div`
  background: white;
  border: 2px solid ${({ featured }) => (featured ? '#D45398' : '#E5E7EB')};
  border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; text-align: left;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transform: ${({ featured }) => (featured ? 'scale(1.05)' : 'scale(1)')};
  transition: all 0.3s ease; position: relative;
  &:hover { transform: translateY(-10px) ${({ featured }) => (featured ? 'scale(1.05)' : 'scale(1.02)')}; }
`;

// ★★★ 關鍵修正：調整 PlanName 的樣式以解決跑版問題 ★★★
const PlanName = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;      /* 設定舒適的行高 */
  min-height: 4rem;      /* 設定一個最小高度，確保所有標題區塊等高 */
  display: flex;         /* 使用 flexbox 進行垂直對齊 */
  align-items: center;   /* 讓單行文字也能垂直置中 */
  justify-content: center; /* 水平置中 */
  text-align: center;
`;

const PlanPrice = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;
const PriceMain = styled.p`
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0.5rem 0;
  color: ${({ featured }) => (featured ? '#D45398' : '#111827')};
`;
const PriceSub = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0.2rem 0;
`;
const SavingsBadge = styled.span`
  background: #10B981;
  color: white;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  margin-left: 5px;
`;
const FeatureList = styled.ul`
  list-style: none;
  padding-left: 0;
  flex-grow: 1;
  margin: 1.5rem 0;
`;
const FeatureItem = styled.li`
  margin-bottom: 1rem;
  color: #374151;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;

  &:before {
    content: '✓';
    color: ${({ featured }) => (featured ? '#D45398' : '#10B981')};
    font-weight: bold;
    margin-right: 10px;
    flex-shrink: 0;
  }
`;
const HighlightFeature = styled(FeatureItem)`
  font-weight: 700;
  color: #111827;
  &:before {
    content: '★';
    color: #F59E0B;
  }
`;
const StyledButton = styled.button`
  display: block; width: 100%; text-align: center; text-decoration: none;
  font-weight: 600; padding: 14px 28px; border-radius: 12px; margin-top: auto;
  border: none;
  background: ${({ featured }) => (featured ? '#D45398' : '#A855F7')};
  color: #FFFFFF; cursor: pointer; transition: all 0.2s ease;
  &:hover { opacity: 0.9; transform: scale(1.02); }
`;
const PopularBadge = styled.div`
  position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
  background: #D45398; color: white; padding: 5px 15px; border-radius: 20px;
  font-size: 0.8rem; font-weight: bold;
`;
const ValueBadge = styled(PopularBadge)`
  background: linear-gradient(45deg, #F59E0B, #EF4444);
  top: -40px;
  padding: 8px 25px;
  font-size: 1rem;
`;
const AnnualNote = styled.div`
  background: #F0FDF4;
  border-radius: 8px;
  padding: 12px;
  margin-top: 20px;
  border: 1px solid #10B981;
  text-align: center;
  font-size: 0.9rem;
  color: #047857;
`;

const PricingPage = () => {
  const navigate = useNavigate();
  const handleChoosePlan = (planCode, price) => navigate(`/payment?plan=${planCode}&price=${price}`);

  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>為您的創作賦權</Title>
            <Subtitle>您投資的不只是工具，而是您每件作品的永久產權與持續增值的潛力。年繳方案僅需支付 10 個月費用。</Subtitle>
          </Header>
          <PricingGrid>
            {/* 入門方案 - 適合剛起步的創作者 */}
            <Card>
              <PlanName>創意守護者</PlanName>
              <PlanPrice>
                <PriceMain>NT$ 490<span style={{ fontSize: '1.2rem' }}> / 月</span></PriceMain>
                <PriceSub>年繳 NT$ 4,900 <SavingsBadge>節省 20%</SavingsBadge></PriceSub>
              </PlanPrice>
              <FeatureList>
                <FeatureItem>100 件作品永久存證席位</FeatureItem>
                <FeatureItem>每月 10 次 AI 侵權偵測</FeatureItem>
                <FeatureItem>每週自動版權巡檢</FeatureItem>
                <FeatureItem>每月 1 次 DMCA 下架服務</FeatureItem>
                <FeatureItem>基本盜版追蹤報告</FeatureItem>
                <HighlightFeature>基礎 P2P 收益共享引擎</HighlightFeature>
              </FeatureList>
              <StyledButton onClick={() => handleChoosePlan('BASIC', 490)}>
                開始守護創作
              </StyledButton>

              <AnnualNote>
                ✓ 年繳僅需 10 個月費用<br />✓ 最經濟的入門選擇
              </AnnualNote>
            </Card>

            {/* 專業方案 - 最佳價值 */}
            <Card featured>
              <PopularBadge>最多創作者選擇</PopularBadge>
              <ValueBadge>最佳性價比</ValueBadge>
              <PlanName>專業捍衛者</PlanName>
              <PlanPrice>
                <PriceMain featured>NT$ 790<span style={{ fontSize: '1.2rem' }}> / 月</span></PriceMain>
                <PriceSub>年繳 NT$ 7,900 <SavingsBadge>節省 25%</SavingsBadge></PriceSub>
              </PlanPrice>
              <FeatureList>
                <FeatureItem featured>300 件作品永久存證席位</FeatureItem>
                <FeatureItem featured>每月 30 次 AI 侵權偵測</FeatureItem>
                <FeatureItem featured>每 72 小時自動巡檢</FeatureItem>
                <FeatureItem featured>每月 3 次 DMCA 加急處理</FeatureItem>
                <FeatureItem featured>深度盜版來源分析報告</FeatureItem>
                <HighlightFeature featured>進階 P2P 收益引擎 +15% 分潤</HighlightFeature>
                <FeatureItem featured>商標監測（3個關鍵字）</FeatureItem>
                <FeatureItem featured>批量侵權處理工具</FeatureItem>
              </FeatureList>
              <StyledButton featured onClick={() => handleChoosePlan('PRO', 790)}>
                升級專業防護
              </StyledButton>

              <AnnualNote>
                ✓ 年繳享 2 個月免費<br />✓ 性價比最高的選擇
              </AnnualNote>
            </Card>

            {/* 旗艦方案 - 高端創作者 */}
            <Card>
              <PlanName>全方位守護者</PlanName>
              <PlanPrice>
                <PriceMain>NT$ 1,490<span style={{ fontSize: '1.2rem' }}> / 月</span></PriceMain>
                <PriceSub>年繳 NT$ 14,900 <SavingsBadge>節省 30%</SavingsBadge></PriceSub>
              </PlanPrice>
              <FeatureList>
                <FeatureItem>500+ 件作品無限擴展存證</FeatureItem>
                <FeatureItem>每月 50 次 AI 偵測（未用可累積）</FeatureItem>
                <FeatureItem><strong>每日優先</strong>全網掃描</FeatureItem>
                <FeatureItem>每月 5 次 DMCA <strong>24小時加急</strong></FeatureItem>
                <HighlightFeature>旗艦版 P2P 收益引擎 +30% 分潤</HighlightFeature>
                <FeatureItem>商標監測（10個關鍵字）</FeatureItem>
                <FeatureItem>批量跨平台處理工具</FeatureItem>
                <FeatureItem>專屬版權法律諮詢（5次/年）</FeatureItem>
                <FeatureItem>VIP 專線快速支援</FeatureItem>
              </FeatureList>
              <StyledButton onClick={() => handleChoosePlan('ELITE', 1490)}>
                尊榮全面守護
              </StyledButton>

              <AnnualNote>
                ✓ 年繳享 3 個月免費<br />✓ 尊榮專屬服務
              </AnnualNote>
            </Card>
          </PricingGrid>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};
export default PricingPage;
