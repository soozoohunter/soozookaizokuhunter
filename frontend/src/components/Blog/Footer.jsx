import React from 'react';
import styled from 'styled-components';

const FooterWrapper = styled.footer`
  border-top: 1px solid rgb(231, 230, 230);
  padding: 40px 32px;

  @media (max-width: 900px) {
    padding: 40px 24px;
  }
`;

const FooterContainer = styled.div`
  max-width: 1536px;
  width: 100%;
  margin: 0 auto;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 40px;
  margin-bottom: 32px;
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FooterNav = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 72px;

  @media (max-width: 600px) {
    gap: 32px;
    flex-direction: column;
  }
`;

const NavColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 170px;
`;

const ColumnTitle = styled.span`
  color: #B6B3B3;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const FooterLink = styled.a`
  color: #858080;
  text-decoration: none;
  transition: color 150ms ease;

  &:hover {
    color: #231A1A;
  }
`;

const BottomSection = styled.div`
  border-top: 1px solid rgb(231, 230, 230);
  padding-top: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
`;

const Copyright = styled.span`
  color: #B6B3B3;
  font-size: 14px;
`;

const Footer = () => {
  return (
    <FooterWrapper>
      <FooterContainer>
        <TopSection>
          <CompanyInfo>
            <span style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>SUZOO</span>
            <p style={{ color: '#9D9999', fontSize: '14px', lineHeight: '1.5' }}>
              100 台北市中正區金山南路一段77號2樓<br />
              hey@suzookaikokuhunter.com
            </p>
          </CompanyInfo>
          <FooterNav>
            <NavColumn>
              <ColumnTitle>網站導覽</ColumnTitle>
              <FooterLink href="/">首頁</FooterLink>
              <FooterLink href="/pricing">價格方案</FooterLink>
            </NavColumn>
            <NavColumn>
              <ColumnTitle>解決方案</ColumnTitle>
              <FooterLink href="#">AI 侵權偵測</FooterLink>
              <FooterLink href="#">區塊鏈存證</FooterLink>
              <FooterLink href="#">DMCA 申訴</FooterLink>
            </NavColumn>
            <NavColumn>
              <ColumnTitle>關於我們</ColumnTitle>
              <FooterLink href="#">媒體專區</FooterLink>
              <FooterLink href="#">合作夥伴</FooterLink>
            </NavColumn>
          </FooterNav>
        </TopSection>
        <BottomSection>
          <Copyright>© {new Date().getFullYear()} • SUZOO IP Guard • All rights reserved</Copyright>
        </BottomSection>
      </FooterContainer>
    </FooterWrapper>
  );
};

export default Footer;
