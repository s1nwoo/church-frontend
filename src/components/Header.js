// src/components/Header.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Header.css';

// AuthContext 불러오기
import { AuthContext } from '../context/AuthContext';

// ✅ newlogo3.png 사용
import newlogo2 from './images/newlogo3.png';

const Header = () => {
  const [latestId, setLatestId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
          size: 1000,
          includeDeleted: false,
        },
      })
      .then((res) => {
        const all = res.data.content.slice().sort((a, b) => b.id - a.id);
        if (all.length) setLatestId(all[0].id);
      })
      .catch(console.error);
  }, []);

  // ✅ 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-menu-container')) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

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
                    <Link to="/login" className="header-auth-btn header-login-btn">로그인</Link>
                    <Link to="/signup" className="header-auth-btn header-signup-btn">회원가입</Link>
                  </>
                )}
              </>
            ) : (
              // ✅ 트렌디한 사용자 메뉴 (드롭다운)
              <div className="user-menu-container">
                <button
                  className="user-menu-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="user-avatar">{user.name?.charAt(0) || 'U'}</span>
                  <span className="user-name">{user.name}님</span>
                  <svg
                    className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="currentColor"/>
                      </svg>
                      내 정보
                    </Link>

                    {/* ✅ 관리자인 경우 관리자 페이지 메뉴 표시 */}
                    {isAdmin() && (
                      <Link
                        to="/admin"
                        className="dropdown-item admin"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M13.5 2H11.71C11.52 0.84 10.53 0 9.33 0H6.67C5.47 0 4.48 0.84 4.29 2H2.5C1.67 2 1 2.67 1 3.5V14.5C1 15.33 1.67 16 2.5 16H13.5C14.33 16 15 15.33 15 14.5V3.5C15 2.67 14.33 2 13.5 2ZM6.67 1.5H9.33C9.7 1.5 10 1.8 10 2.17C10 2.54 9.7 2.83 9.33 2.83H6.67C6.3 2.83 6 2.54 6 2.17C6 1.8 6.3 1.5 6.67 1.5ZM13.5 14.5H2.5V3.5H4V4.83C4 5.2 4.3 5.5 4.67 5.5H11.33C11.7 5.5 12 5.2 12 4.83V3.5H13.5V14.5Z" fill="currentColor"/>
                        </svg>
                        관리자 페이지
                      </Link>
                    )}

                    <button
                      className="dropdown-item logout"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 14H2V2H6V0H2C0.9 0 0 0.9 0 2V14C0 15.1 0.9 16 2 16H6V14ZM12.09 11.59L13.5 13L16 10.5L13.5 8L12.09 9.41L13.17 10.5H6V12.5H13.17L12.09 11.59Z" fill="currentColor"/>
                      </svg>
                      로그아웃
                    </button>
                  </div>
                )}
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
                <Link to="#" className="menu-item">
                  예배 미디어
                </Link>
              )}

              <Link to="/posts" className="menu-item">
                소식 나눔
              </Link>
            </nav>
          )}

          {/* 햄버거 (모바일) */}
          {!isAuthPage && (
            <div className="hamburger-menu">
              <button className="hamburger-button" aria-label="메뉴 열기">
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;