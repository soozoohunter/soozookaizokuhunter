import React from 'react';
import styled from 'styled-components';

const PageSpacer = styled.div` min-height: 74px; `;
const ArticleWrapper = styled.div` padding: 4rem 2rem; background: white; `;
const ArticleContainer = styled.article` max-width: 800px; margin: 0 auto; line-height: 1.8; font-size: 1.1rem; `;
const ArticleTitle = styled.h1` font-size: 2.5rem; margin-bottom: 2rem; `;

const EcommerceImageTheftPrevention = () => {
    return (
        <>
            <PageSpacer />
            <ArticleWrapper>
                <ArticleContainer>
                    <ArticleTitle>蝦皮賣家必看：如何防止商品圖被盜用在「一頁式詐騙」？(附自救 SOP)</ArticleTitle>
                    <p>辛苦拍攝的商品圖，卻被詐騙集團盜用在假網站上？這不僅影響銷售，更嚴重損害您的品牌信譽。本文教您如何透過 SUZOO 的 AI 哨兵功能，自動揪出盜圖者，並快速採取行動。</p>
                </ArticleContainer>
            </ArticleWrapper>
        </>
    );
};

export default EcommerceImageTheftPrevention;
