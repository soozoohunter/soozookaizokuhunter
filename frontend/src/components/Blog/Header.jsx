import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

// ... (所有 Styled Components 與您現有版本相同，此處省略以求簡潔)
const HeaderWrapper = styled.header`...`;
const Toolbar = styled.div`...`;
const LogoLink = styled(Link)`...`;
const NavLinks = styled.nav`...`;
const NavLink = styled(Link)`...`;
const ActionButtons = styled.div`...`;
const LoginLink = styled(Link)`...`;
const StyledButton = styled(Link)`...`;
const HamburgerMenu = styled.button`...`;
const MobileMenu = styled.div`...`;


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <HeaderWrapper>
      <Toolbar>
        <LogoLink to="/" onClick={closeMenu}>
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
            <svg width="24" height="15" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">{/* ... svg content ... */}</svg>
          </HamburgerMenu>
        </ActionButtons>
      </Toolbar>
      {isMenuOpen && (
        <MobileMenu>
          <NavLink to="/solutions/ai-detection" onClick={closeMenu}>核心功能</NavLink>
          <NavLink to="/pricing" onClick={closeMenu}>價格方案</NavLink>
          <NavLink to="/contact" onClick={closeMenu}>聯絡我們</NavLink>
          <NavLink to="/about" onClick={closeMenu}>關於我們</NavLink>
          {user ? (
            <>
              {user.role === 'admin' && <NavLink to="/admin/dashboard" onClick={closeMenu}>管理後台</NavLink>}
              <NavLink to="/dashboard" onClick={closeMenu}>會員中心</NavLink>
              <NavLink as="button" onClick={() => { logout(); closeMenu(); }} style={{textAlign: 'left', background:'none', border:'none', padding:0, fontSize: 'inherit', fontFamily: 'inherit' }}>登出</NavLink>
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
