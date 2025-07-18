import React from 'react';
import styled from 'styled-components';

const PageSpacer = styled.div`
  min-height: 74px;
`;

const ArticleWrapper = styled.article`
  width: 100%;
`;

const HeroSection = styled.div`
  padding: 48px 24px;
`;

const HeroContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  font-size: 20px;
  line-height: 1.5;

  h2, h3 {
    font-weight: 800;
    margin: 24px 0 16px 0;
  }

  p {
    margin-bottom: 16px;
  }

  img {
    max-width: 100%;
    height: auto;
    margin: 24px 0;
  }

  ol {
    padding-left: 20px;
  }
`;

const BlogPostPage = () => (
  <>
    <PageSpacer />
    <ArticleWrapper>
      <HeroSection>
        <HeroContainer>
          <Title>終結廣告投放無效：廣告平台選擇技巧 + 投放心法一次掌握！</Title>
          <Subtitle>
            廣告投放無效怎麼辦？市面上廣告平台百百種，該如何選擇屬於自己品牌的網路廣告平台？本文將分享選擇廣告平台的技巧以及說明成效型和成交型廣告的效益，有效提升廣告轉換率！
          </Subtitle>
          <FeaturedImage>
            <img src="https://images.prismic.io/rosetta-marketing-website/dd7036bb-2d25-4138-b9e2-03ccf2ac79f3_Adstyle%E2%80%94%E2%80%942%E5%B9%B4%E5%BA%A6blogpost-min.png?auto=compress,format" alt="廣告平台選擇技巧" />
          </FeaturedImage>
        </HeroContainer>
      </HeroSection>
      <ContentSection>
        <ContentContainer>
          <h2>為什麼數位廣告投放無效？三種原因一次檢視！</h2>
          <p>數位廣告愈來愈盛行，然而現在的流量愈來越貴，當廣告成效不如預期時，並不是提高廣告費用為最佳解，可以從以下三個原因來檢視，幫助你省下荷包...</p>
          <h3>原因一：受眾設定不夠精準</h3>
          <p>若你的廣告受眾設定目標太廣泛，例如投放 fb 廣告時直接選用預設受眾僅調整年齡、性別、興趣和所在位置等設定，很容易將投放出去的廣告顯示給不適合的受眾，難以達到你預期的廣告效益...</p>
        </ContentContainer>
      </ContentSection>
    </ArticleWrapper>
  </>
);

export default BlogPostPage;
