import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => (
  <header className="header">
    <div className="header-inner page-container">
      {/* 로고 */}
      <div className="logo-container">
        <Link to="/">
          <img
            src="/images/logo.jpg"
            alt="방화침례교회 로고"
            className="logo-image"
          />
          <span className="logo-text">방화침례교회</span>
        </Link>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="nav-menu">
        <Link to="/services" className="menu-item">예배와 말씀</Link>
        <Link to="/about" className="menu-item">교회소개</Link>
        <Link to="/mission" className="menu-item">양육과 선교</Link>
        <Link to="/next-generation" className="menu-item">다음세대</Link>
        <Link to="/community" className="menu-item">성도의 교제</Link>
      </nav>

      {/* 햄버거 메뉴 (모바일 전용) */}
      <div className="hamburger-menu">
        <button className="hamburger-button" aria-label="메뉴 열기">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="hamburger-icon"
          >
            <rect y="4" width="24" height="2" />
            <rect y="11" width="24" height="2" />
            <rect y="18" width="24" height="2" />
          </svg>
        </button>
      </div>
    </div>
  </header>
);

export default Header;
