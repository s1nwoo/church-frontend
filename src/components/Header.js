import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

// images 폴더에 newlogo.png, newlogo2.png를 위치시킵니다.
import newlogo from './images/newlogo2.png';
import newlogo2 from './images/newlogo1.png';

const Header = () => {
  // 교체할 로고를 배열로 관리
  const logos = [newlogo, newlogo2];
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  useEffect(() => {
    // 1초마다 index를 0,1,0,1... 순환하도록 설정
    const intervalId = setInterval(() => {
      setCurrentLogoIndex(prev => (prev + 1) % logos.length);
    }, 1500);

    // 언마운트 시 인터벌 클리어
    return () => clearInterval(intervalId);
  }, []);

  return (
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
              <img
                src={logos[currentLogoIndex]}
                alt="교회 로고"
                className="logo-image"
              />
            </Link>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="nav-menu">
            <Link to="/church-intro" className="menu-item">교회소개</Link>
            <Link to="/about"    className="menu-item">예배 미디어</Link>
            <Link to="/mission"  className="menu-item">소식 나눔</Link>
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
};

export default Header;
