import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const FooterWrapper = styled.footer`
  background-color: #F8F8F8;
  border-top: 1px solid #EAEAEA;
  padding: 4rem 2rem;
  font-size: 0.9rem;
`;

const FooterContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
`;

const BrandSection = styled.div`
  p {
    color: #6B7280;
    line-height: 1.6;
  }
`;

const NavSection = styled.div``;

const NavTitle = styled.h4`
  font-weight: bold;
  margin-bottom: 1rem;
  color: #1F2937;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin-bottom: 0.75rem;
`;

const NavLink = styled(Link)`
  color: #6B7280;
  text-decoration: none;
  &:hover {
    color: #D45398;
  }
`;

const CopyrightSection = styled.div`
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #EAEAEA;
  color: #9CA3AF;
`;

const Footer = () => {
  return (
    <FooterWrapper>
      <FooterContainer>
        <BrandSection>
          <NavTitle>SUZOO IP Guard</NavTitle>
          <p>100 台北市中山區泰順街40巷10弄5號</p>
          <p>220新北市板橋區三民路二段153巷36弄3號2樓</p>
          <p>hey@suzookaikaikuhunter.com</p>
        </BrandSection>
        <NavSection>
          <NavTitle>網站導覽</NavTitle>
          <NavList>
            <NavItem><NavLink to="/">首頁</NavLink></NavItem>
            <NavItem><NavLink to="/pricing">價格方案</NavLink></NavItem>
          </NavList>
        </NavSection>
        <NavSection>
          <NavTitle>解決方案</NavTitle>
          <NavList>
            {/* [★★ 關鍵修正 ★★] 更新連結 */}
            <NavItem><NavLink to="/solutions/ai-detection">AI 侵權偵測</NavLink></NavItem>
            <NavItem><NavLink to="/solutions/blockchain">區塊鏈存證</NavLink></NavItem>
            <NavItem><NavLink to="/solutions/dmca-takedown">DMCA 申訴</NavLink></NavItem>
          </NavList>
        </NavSection>
        <NavSection>
          <NavTitle>關於我們</NavTitle>
          <NavList>
            <NavItem><NavLink to="#">媒體專區</NavLink></NavItem>
            <NavItem><NavLink to="#">合作夥伴</NavLink></NavItem>
          </NavList>
        </NavSection>
      </FooterContainer>
      <CopyrightSection>
        © 2025 SUZOO IP Guard • All rights reserved
      </CopyrightSection>
    </FooterWrapper>
  );
};

export default Footer;
