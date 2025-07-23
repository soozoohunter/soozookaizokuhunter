import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

const HeaderWrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
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
  color: #0A0101;
`;

const NavLinks = styled.nav`
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

const MobileMenu = styled.div`
  position: fixed;
  top: 74px;
  left: 0;
  width: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  @media (min-width: 1201px) {
    display: none;
  }
`;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <HeaderWrapper>
      <Toolbar>
        <LogoLink to="/" onClick={closeMenu}>
          {/* ★ 優化：使用我們已處理好的透明背景 Logo ★ */}
          <img src="/suzoo-logo-transparent.png" alt="SUZOO IP Guard Logo" style={{ height: '40px', marginRight: '10px' }} />
          <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>SUZOO IP Guard</span>
        </LogoLink>
        <NavLinks>
          <NavLink to="/solutions/ai-detection">核心功能</NavLink>
          <NavLink to="/pricing">價格方案</NavLink>
          <NavLink to="/contact">聯絡我們</NavLink>
          <NavLink to="/about">關於我們</NavLink>
        </NavLinks>
        <ActionButtons>
          {user ? (
            <>
              {user.role === 'admin' && (
                <LoginLink to="/admin/dashboard" style={{ fontWeight: 'bold', color: '#D45398' }}>
                  管理後台
                </LoginLink>
              )}
              <LoginLink to="/dashboard">會員中心</LoginLink>
              <StyledButton as="button" onClick={logout}>登出</StyledButton>
            </>
          ) : (
            <>
              <LoginLink to="/login">登入</LoginLink>
              <StyledButton to="/register">註冊會員</StyledButton>
            </>
          )}
          <HamburgerMenu onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="3" fill="#544D4D" /><rect y="6" width="24" height="3" fill="#544D4D" /><rect y="12" width="24" height="3" fill="#544D4D" /></svg>
          </HamburgerMenu>
        </ActionButtons>
      </Toolbar>
      {isMenuOpen && (
        <MobileMenu>
          <NavLink to="/solutions/ai-detection" onClick={closeMenu}>核心功能</NavLink>
          <NavLink to="/pricing" onClick={closeMenu}>價格方案</NavLink>
          <NavLink to="/contact" onClick={closeMenu}>聯絡我們</NavLink>
          <NavLink to="/about" onClick={closeMenu}>關於我們</NavLink>
          <hr style={{border: 'none', borderTop: '1px solid #eee'}} />
          {user ? (
            <>
              {user.role === 'admin' && <NavLink to="/admin/dashboard" onClick={closeMenu}>管理後台</NavLink>}
              <NavLink to="/dashboard" onClick={closeMenu}>會員中心</NavLink>
              <NavLink as="button" onClick={() => { logout(); closeMenu(); }} style={{ textAlign: 'left', background:'none', border:'none', padding:0, fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 600, color: '#858080' }}>登出</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={closeMenu}>登入</NavLink>
              <NavLink to="/register" onClick={closeMenu}>註冊會員</NavLink>
            </>
          )}
        </MobileMenu>
      )}
    </HeaderWrapper>
  );
};

export default Header;
