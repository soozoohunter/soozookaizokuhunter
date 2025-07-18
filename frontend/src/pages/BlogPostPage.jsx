import React from 'react';
import styled from 'styled-components';

const PageSpacer = styled.div`
  min-height: 74px;
`;

const ArticleWrapper = styled.article`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.light.background};
  color: ${({ theme }) => theme.colors.light.text};
`;

const HeroSection = styled.div`
  padding: 48px 24px;
  background-color: ${({ theme }) => theme.colors.light.card};
  border-bottom: 1px solid ${({ theme }) => theme.colors.light.border};
`;

const HeroContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 40px;
  font-weight: 800;
  line-height: 1.3;
  @media (max-width: 600px) {
    font-size: 32px;
  }
`;

const Subtitle = styled.p`
  font-size: 20px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.light.textMuted};
  @media (max-width: 600px) {
    font-size: 16px;
  }
`;

const FeaturedImage = styled.div`
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius};

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ContentSection = styled.section`
  padding: 40px 24px 16px 24px;
`;

const ContentContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  font-size: 18px;
  line-height: 1.7;

  h2, h3 {
    font-weight: 700;
    margin: 40px 0 16px 0;
    line-height: 1.4;
  }
  
  h2 {
    font-size: 28px;
    border-bottom: 2px solid ${({ theme }) => theme.colors.light.primary};
    padding-bottom: 8px;
  }
  
  h3 {
    font-size: 22px;
  }

  p {
    margin-bottom: 16px;
  }

  strong {
    color: ${({ theme }) => theme.colors.light.primary};
  }
`;

const BlogPostPage = () => (
  <>
    <PageSpacer />
    <ArticleWrapper>
      <HeroSection>
        <HeroContainer>
          <Title>全球首創：用區塊鏈為您的創作打上無法抹滅的永恆印記</Title>
          <Subtitle>
            在數位時代，複製貼上易如反掌，您的心血結晶正暴露於前所未有的風險中。了解 SUZOO IP Guard 如何利用世界唯一的技術，從根本上顛覆智慧財產權的保護方式。
          </Subtitle>
          <FeaturedImage>
            <img src="https://images.unsplash.com/photo-1614064548237-02f9d3ed884c?q=80&w=2070&auto=format&fit=crop" alt="Blockchain technology concept" />
          </FeaturedImage>
        </HeroContainer>
      </HeroSection>
      <ContentSection>
        <ContentContainer>
          <h2>數位創作的困境：當「證據」比「創作」更難</h2>
          <p>您是否曾發現自己的攝影作品、設計圖稿或影片被盜用，卻苦於無法提出最直接、最權威的創作時間證明？傳統的版權登記流程繁瑣、耗時，且往往在侵權發生後才採取行動，早已錯失先機。在網路上，誰先發布，似乎就擁有了話語權，這對原創者極為不公。</p>
          
          <h3>挑戰一：證明「你是第一個」的難題</h3>
          <p>一張螢幕截圖、一個檔案的「修改日期」，在法律上都可能受到質疑。您需要的是一個<strong>無法被篡改、全球公認、帶有精確時間戳</strong>的鐵證。</p>
          
          <h2>革命性解決方案：世界首創的區塊鏈存證技術</h2>
          <p>SUZOO IP Guard 徹底解決了這個核心痛點。我們是<strong>全球唯一首創</strong>將智慧財產權保護與區塊鏈技術深度結合的平台。當您上傳作品的瞬間，系統會立即為您的檔案計算出獨一無二的 <strong>SHA-256 數位指紋</strong>，並將這個包含時間戳的指紋「上鏈」，永久記錄在去中心化的公開帳本上。</p>
          <p>這意味著什麼？</p>
          <p><strong>這份創作證明是絕對的、不可逆的、且受到全球節點共同見證的。</strong> 從您上傳的那一秒起，您就擁有了全世界最強大的原創著作權證明，任何人都無法否認或修改您的創作時間點。</p>
          
          <h2>不只存證，更要維權：一條龍式的侵權打擊服務</h2>
          <p>擁有鐵證只是第一步。SUZOO IP Guard 提供的是從存證到維權的一站式服務閉環。我們的 AI 引擎 24/7 不間斷地掃描全球各大社群平台與網站，一旦發現與您作品數位指紋相符的盜用內容，便會立即通知您。</p>
          
          <h3>一鍵 DMCA 申訴，讓侵權內容無所遁形</h3>
          <p>當您確認侵權事實後，無需再經歷繁瑣的跨國法律流程。透過我們深度整合的 <strong>DMCA.com 官方 API</strong>，您只需在後台點擊一個按鈕，系統就會自動產生符合國際法律規範的下架通知 (Takedown Notice)，直接發送給侵權內容所在的平台（如 YouTube, Instagram, Facebook 等）。</p>
          <p>這就是 SUZOO IP Guard 的力量：從<strong>無法撼動的區塊鏈證據</strong>，到<strong>高效自動化的 AI 偵測</strong>，再到<strong>一鍵執行的全球法律行動</strong>。我們將複雜的智財權保護流程，簡化為您指尖的幾次點擊。立即開始，為您的每一個創意加上最堅固的區塊鏈護盾！</p>
        </ContentContainer>
      </ContentSection>
    </ArticleWrapper>
  </>
);

export default BlogPostPage;
