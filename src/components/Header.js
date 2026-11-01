// src/components/Header.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Header.css';
import SessionCountdown from './SessionCountdown';
import { tokenExpiresAt } from '../utils/authSession';

// AuthContext 불러오기
import { AuthContext } from '../context/AuthContext';

// ✅ newlogo3.png 사용
import newlogo2 from './images/newlogo3.png';

const Header = () => {
  const [latestId, setLatestId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // ✅ 모바일 메뉴 상태 추가
  const location = useLocation();

  // ✅ 로그인 상태
  const { user, logout } = useContext(AuthContext);

  // ✅ 로그인/회원가입 페이지인지 확인
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  // ✅ 관리자 여부 확인 함수
  const isAdmin = () => {
    if (!user) return false;
    const role = typeof user.role === 'string' ? user.role : user.role?.name || user.role?.value;
    return role === 'ADMIN' || role === 'ROLE_ADMIN';
  };

  // 최신 설교 ID 조회
  useEffect(() => {
    axios
      .get('/api/sermons', {
        params: {
          page: 0,
          size: 1,
          worshipType: 'SUNDAY',
          includeDeleted: false,
        },
      })
      .then((res) => {
        const all = res.data.content;
        if (all.length) setLatestId(all[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    function closeMobileMenu(event) {
      if (!event.target.closest('.mobile-nav') && !event.target.closest('.hamburger-button')) setMobileMenuOpen(false);
    }
    document.addEventListener('click', closeMobileMenu);
    return () => document.removeEventListener('click', closeMobileMenu);
  }, []);
  // ✅ 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ✅ 로그인 페이지일 때 body에 클래스 추가
  useEffect(() => {
    if (isAuthPage) {
      document.body.classList.add('auth-page');
    } else {
      document.body.classList.remove('auth-page');
    }

    return () => {
      document.body.classList.remove('auth-page');
    };
  }, [isAuthPage]);

  return (
    <>
      {/* ─── 상단 바 (항상 표시) ─── */}
      <div className="top-bar">
        <div className="top-bar-inner page-container">
          <div className="auth-links">
            {!user ? (
              <>
                {/* ✅ 로그인/회원가입 페이지에서는 "방화침례교회 홈" 표시 */}
                {isAuthPage ? (
                  <Link to="/" className="church-home-link">방화침례교회 홈</Link>
                ) : (
                  <>
                  {/*
                  <Link to="/login" className="header-auth-btn header-login-btn">로그인</Link>
                  <Link to="/signup" className="header-auth-btn header-signup-btn">회원가입</Link>
                  */}
                  </>
                )}
              </>
            ) : (
              <div className="header-account" aria-label="로그인 정보">
                <span className="user-name">{user.name}님</span>
                <SessionCountdown expiresAt={tokenExpiresAt(user.accessToken)} />
                <nav className="header-account-links" aria-label="계정 메뉴">
                  <Link to="/profile">내 정보</Link>
                  {isAdmin() && <Link to="/admin">관리자</Link>}
                  <button type="button" data-auth-logout onClick={() => logout()}>로그아웃</button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 메인 헤더 ─── */}
      <header className={`main-header ${isAuthPage ? 'auth-page-header' : ''}`}>
        <div className="header-inner page-container">
          {/* 로고 */}
          <div className="logo-container">
            <Link to="/">
              <img
                src={newlogo2}
                alt="교회 로고"
                className="logo-image"
              />
            </Link>
          </div>

          {/* 네비게이션 메뉴 (로그인 페이지에서는 숨김) */}
          {!isAuthPage && (
            <nav className="nav-menu">
              <Link to="/church-intro" className="menu-item">
                교회소개
              </Link>

              {latestId ? (
                <Link to={`/worship-media/${latestId}`} className="menu-item">
                  예배 미디어
                </Link>
              ) : (
                <Link to="/worship-media" className="menu-item">
                  예배 미디어
                </Link>
              )}

              <Link to="/posts" className="menu-item">
                소식 나눔
              </Link>
            </nav>
          )}

          {/* ✅ 햄버거 버튼 (모바일) - onClick 추가 */}
          {!isAuthPage && (
            <div className="hamburger-menu">
              <button
                className={`hamburger-button ${mobileMenuOpen ? 'open' : ''}`}
                aria-label="메뉴 열기"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
              </button>
            </div>
          )}
        </div>

        {/* ✅ 모바일 드롭다운 메뉴 */}
        {!isAuthPage && mobileMenuOpen && (
          <nav className="mobile-nav">
            <Link to="/church-intro" className="mobile-nav-item">
              교회소개
            </Link>
            {latestId ? (
              <Link to={`/worship-media/${latestId}`} className="mobile-nav-item">
                예배 미디어
              </Link>
            ) : (
              <Link to="/worship-media" className="mobile-nav-item">
                예배 미디어
              </Link>
            )}
            <Link to="/posts" className="mobile-nav-item">
              소식 나눔
            </Link>
          </nav>
        )}
      </header>
    </>
  );
};

export default Header;
