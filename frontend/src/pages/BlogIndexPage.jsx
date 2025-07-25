import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PageSpacer = styled.div` min-height: 74px; `;
const PageWrapper = styled.div` padding: 4rem 2rem; `;
const ContentContainer = styled.div` max-width: 900px; margin: 0 auto; `;
const Title = styled.h1` font-size: 3rem; text-align: center; margin-bottom: 3rem; `;
const ArticleList = styled.div` display: grid; gap: 2rem; `;
const ArticleCard = styled(Link)`
  display: block; text-decoration: none; color: inherit; background: white;
  border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden; transition: all 0.3s ease;
  &:hover { transform: translateY(-5px); box-shadow: 0 8px 15px rgba(0,0,0,0.1); }
`;
const ArticleTitle = styled.h2` margin: 0; font-size: 1.5rem; `;
const ArticleExcerpt = styled.p` color: #6b7280; `;

const articles = [
    {
        id: 1,
        slug: 'ai-artwork-copyright-guide',
        title: 'AI 繪圖算誰的？5 分鐘搞懂 Midjourney 版權歸屬與自保之道',
        excerpt: '隨著 Midjourney, Stable Diffusion 等 AI 工具的普及，AI 生成的圖片版權到底屬於誰？這篇文章將帶您深入探討目前的法律觀點，並教您如何使用 SUZOO 的區塊鏈存證來為您的「AI 咒術」成果建立不可否認的權利證明。'
    },
    {
        id: 2,
        slug: 'ecommerce-image-theft-prevention',
        title: '蝦皮賣家必看：如何防止商品圖被盜用在「一頁式詐騙」？(附自救 SOP)',
        excerpt: '辛苦拍攝的商品圖，卻被詐騙集團盜用在假網站上？這不僅影響銷售，更嚴重損害您的品牌信譽。本文將提供一套完整的防範與應對策略，並告訴您如何利用 SUZOO 的 AI 哨兵功能，自動揪出這些盜圖兇手。'
    },
    {
        id: 3,
        slug: 'blockchain-evidence-legal-validity',
        title: '一篇文搞懂「區塊鏈存證」的法律效力，為何律師都推薦它？',
        excerpt: '「區塊鏈」聽起來很複雜，但它卻是數位時代最強大的證據工具。我們將用最簡單的方式，解釋區塊鏈存證為何具有不可篡改性，以及它如何在法庭上成為決定勝負的關鍵證據，保護您的智慧財產權。'
    },
    {
        id: 4,
        slug: 'copyright-myths-buster',
        title: '迷思破解：加上浮水印就安全了嗎？破解 5 個創作者最常見的版權迷思',
        excerpt: '浮水印、禁止下載、版權聲明真的能保護您的作品嗎？本文一次解析五大常見迷思，並提供最有效的自保策略。'
    },
    {
        id: 5,
        slug: 'p2p-engine-case-study',
        title: '案例研究：我的商品圖被一頁式詐騙盜用後，如何用 P2P 引擎在 72 小時內將損失轉為收益？',
        excerpt: '透過 SUZOO 的 P2P 變現引擎，蝦皮賣家 Amy 在 72 小時內不僅制止盜圖，還意外創造收入，看看她是怎麼做到的。'
    },
    {
        id: 6,
        slug: 'user-testimonial-ai-sentinel',
        title: '用戶見證：身為全職插畫家，SUZOO 的「AI 哨兵」每月為我省下超過 20 小時的人工搜圖時間。',
        excerpt: '知名圖文作家 Isabelle 分享她如何利用 SUZOO 的 AI 哨兵功能，擺脫手動搜圖的惱人流程，專注於創作本身。'
    },
    {
        id: 7,
        slug: 'scam-nemesis-deepfake-protection',
        title: '詐騙集團剋星！SUZOO 如何斬斷伸向網紅與名人的 AI 黑產鏈？',
        excerpt: '您是否曾在社群上看過名人用逼真的聲音和嘴型，推薦可疑的產品？這很可能不是本人！本文揭示 AI 深度偽造詐騙的原理，並提供最前沿的應對策略。'
    },
];

const BlogIndexPage = () => {
    return (
        <>
            <PageSpacer />
            <PageWrapper>
                <ContentContainer>
                    <Title>創作者專欄</Title>
                    <ArticleList>
                        {articles.map(article => (
                            <ArticleCard key={article.id} to={`/blog/${article.slug}`}>
                                <div style={{padding: '1.5rem'}}>
                                    <ArticleTitle>{article.title}</ArticleTitle>
                                    <ArticleExcerpt>{article.excerpt}</ArticleExcerpt>
                                </div>
                            </ArticleCard>
                        ))}
                    </ArticleList>
                </ContentContainer>
            </PageWrapper>
        </>
    );
};

export default BlogIndexPage;
