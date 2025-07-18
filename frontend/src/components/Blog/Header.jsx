import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const HeaderWrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  z-index: 1100;
  border-bottom: 1px solid rgb(231, 230, 230);
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 74px;
  padding: 0 32px;

  @media (max-width: 900px) {
    padding: 0 24px;
  }
`;

const LogoLink = styled(Link)`
  text-decoration: none;
  display: flex;
  align-items: center;
  color: #0A0101; // Ensure logo text is visible on light background
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 36px;

  @media (max-width: 1200px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: #858080;
  font-weight: 600;
  cursor: pointer;
  transition: color 150ms ease;

  &:hover {
    color: #231A1A;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LoginLink = styled(Link)`
    text-decoration: none;
    color: #858080;
    font-weight: 500;
    letter-spacing: -0.08px;

    &:hover {
        color: #231A1A;
    }
`;

const StyledButton = styled(Link)`
  text-decoration: none;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid #D45398;
  background: #EBB0CF;
  color: #0A0101;
  box-shadow: 2px 2px 0px #D45398;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 4px 4px 0px #D45398;
    transform: translate(-2px, -2px);
  }
`;

const HamburgerMenu = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;

  @media (max-width: 1200px) {
    display: block;
  }
`;

const Header = () => {
  return (
    <HeaderWrapper>
      <Toolbar>
        <LogoLink to="/">
          <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>SUZOO</span>
        </LogoLink>
        <NavLinks>
          <NavLink to="/">解決方案</NavLink>
          <NavLink to="/pricing">價格方案</NavLink>
          <NavLink to="/">相關資源</NavLink>
          <NavLink to="/">關於我們</NavLink>
        </NavLinks>
        <ActionButtons>
          <LoginLink to="/login">登入</LoginLink>
          <StyledButton to="/register">免費諮詢</StyledButton>
          <HamburgerMenu>
            <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="3" fill="#544D4D" />
              <rect y="6" width="24" height="3" fill="#544D4D" />
              <rect y="12" width="24" height="3" fill="#544D4D" />
            </svg>
          </HamburgerMenu>
        </ActionButtons>
      </Toolbar>
    </HeaderWrapper>
  );
};

export default Header;
