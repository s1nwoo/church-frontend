import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

// logo.png 가 src/components/images/logo.png 에 있다고 가정
import logoImg from './images/newlogo2.png';

const Header = () => (
  <>
    {/* ─── 상단 바 ─── */}
    <div className="top-bar">
      <div className="top-bar-inner page-container">
        <div className="auth-links">
          <Link to="/login">로그인</Link>

          <Link to="/join">회원가입</Link>
        </div>
      </div>
    </div>

    {/* ─── 메인 헤더 ─── */}
    <header className="main-header">
      <div className="header-inner page-container">
        {/* 로고 */}
        <div className="logo-container">
          <Link to="/">
            <img src={logoImg} alt="교회 로고" className="logo-image" />
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="nav-menu">
          <Link to="/services" className="menu-item">예배와 말씀</Link>
          <Link to="/about"    className="menu-item">교회소개</Link>
          <Link to="/mission"  className="menu-item">양육과 선교</Link>
          <Link to="/next"     className="menu-item">다음세대</Link>
          <Link to="/fellow"   className="menu-item">성도의 교제</Link>
        </nav>

        {/* 햄버거 (모바일 보일 때) */}
        <div className="hamburger-menu">
          <button className="hamburger-button" aria-label="메뉴 열기">
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>
      </div>
    </header>
  </>
);

export default Header;
