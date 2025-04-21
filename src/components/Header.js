// src/components/Header.js
import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <img src="/images/logo.png" alt="사랑의교회 로고" height="36" />
        </div>

        <nav className="nav">
          <ul>
            <li>교회소개</li>
            <li>설교 · 찬양</li>
            <li>목양 · 사역</li>
            <li>교육 · 훈련</li>
          </ul>
        </nav>

        <div className="login-btn">
          <button>로그인</button>
        </div>
      </div>
    </header>
  );
};

export default Header;