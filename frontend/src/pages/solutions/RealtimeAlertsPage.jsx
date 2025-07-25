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

const RealtimeAlertsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageSpacer />
      <PageWrapper>
        <ContentContainer>
          <Header>
            <Title>即時威脅警報：在黃金時間內採取行動</Title>
            <Subtitle>在侵權事件中，時間就是一切。晚一天處理，可能就意味著數百位消費者受騙，或您的作品被二次傳播到無法控制的範圍。SUZOO 的即時警報系統，就是為了幫您贏回時間主導權。</Subtitle>
          </Header>
          <Section>
            <SectionTitle>從「發現」到「行動」，零時差</SectionTitle>
            <p>忘掉每週手動搜尋一次的低效模式。SUZOO 的運作流程是全自動化的：</p>
            <ol>
              <li><strong>AI 哨兵發現威脅</strong>: 我們的系統在全球網路中發現疑似侵權的內容。</li>
              <li><strong>系統立即通知</strong>: 在幾分鐘內，您的會員儀表板會出現紅點提示，同時一封詳細的警報 Email 會發送到您的信箱。</li>
              <li><strong>一鍵進入戰情室</strong>: 您可以直接從 Email 中的連結，登入到 SUZOO 的「維權案件管理」介面，看到所有被整理好的侵權證據。</li>
              <li><strong>立即採取行動</strong>: 您可以立刻決定，是要啟動 P2P 變現引擎，還是發動 DMCA 下架申訴。</li>
            </ol>
            <p>我們將原本需要數小時甚至數天的繁瑣流程，縮短為您只需幾分鐘即可完成的決策，這就是在數位戰爭中致勝的關鍵。</p>
          </Section>
          <CTASection>
            <h3>停止被動等待，開始主動出擊</h3>
            <p>侵權不會等你。立即升級您的方案，啟用即時警報與 P2P 變現引擎，將每一次威脅，都轉化為您展現權利與創造價值的機會。</p>
            <PrimaryButton onClick={() => navigate('/pricing')}>查看方案，升級您的反應速度</PrimaryButton>
          </CTASection>
        </ContentContainer>
      </PageWrapper>
    </>
  );
};
export default RealtimeAlertsPage;
