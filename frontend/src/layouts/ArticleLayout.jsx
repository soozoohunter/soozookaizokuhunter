import React from 'react';
import styled from 'styled-components';

const PageSpacer = styled.div` min-height: 74px; `;
const ArticleWrapper = styled.div` padding: 4rem 2rem; background: white; `;
const ArticleContainer = styled.article`
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.8;
  font-size: 1.1rem;
  color: #333;

  h1, h2, h3 {
    color: #111;
  }

  h1 {
    font-size: 2.8rem;
    margin-bottom: 1.5rem;
    line-height: 1.3;
  }

  h2 {
    font-size: 2rem;
    margin-top: 3rem;
    margin-bottom: 1.5rem;
    border-left: 4px solid #D45398;
    padding-left: 1rem;
  }

  h3 {
    font-size: 1.5rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  a {
    color: #A855F7;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  strong {
    color: #111;
  }

  ol, ul {
    padding-left: 1.5rem;
  }
`;
const ArticleMeta = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1.5rem;
`;
const CTASection = styled.div`
  margin: 3rem 0;
  padding: 2.5rem;
  background: #fdf2f8;
  border-radius: 8px;
  text-align: center;
  border: 2px solid #D45398;
`;
const PrimaryButton = styled.button`
  background: #D45398;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    opacity: 0.9;
    transform: scale(1.03);
  }
`;

const ArticleLayout = ({ children }) => {
  return (
    <>
      <PageSpacer />
      <ArticleWrapper>
        <ArticleContainer>
          {children}
        </ArticleContainer>
      </ArticleWrapper>
    </>
  );
};

export { ArticleMeta, CTASection, PrimaryButton };
export default ArticleLayout;
