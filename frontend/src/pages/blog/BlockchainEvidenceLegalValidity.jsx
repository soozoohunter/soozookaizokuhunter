import React from 'react';
import styled from 'styled-components';

const PageSpacer = styled.div` min-height: 74px; `;
const ArticleWrapper = styled.div` padding: 4rem 2rem; background: white; `;
const ArticleContainer = styled.article` max-width: 800px; margin: 0 auto; line-height: 1.8; font-size: 1.1rem; `;
const ArticleTitle = styled.h1` font-size: 2.5rem; margin-bottom: 2rem; `;

const BlockchainEvidenceLegalValidity = () => {
    return (
        <>
            <PageSpacer />
            <ArticleWrapper>
                <ArticleContainer>
                    <ArticleTitle>一篇文搞懂「區塊鏈存證」的法律效力，為何律師都推薦它？</ArticleTitle>
                    <p>「區塊鏈」聽起來很複雜，但它卻是數位時代最強大的證據工具。本文簡介區塊鏈存證的不可篡改性，以及它在法庭上如何協助您保護智慧財產權。</p>
                </ArticleContainer>
            </ArticleWrapper>
        </>
    );
};

export default BlockchainEvidenceLegalValidity;
