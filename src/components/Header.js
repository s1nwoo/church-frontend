// src/components/Header.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Header.css';

// images 폴더에 newlogo1.png, newlogo2.png를 위치시킵니다.
import newlogo1 from './images/newlogo1.png';
import newlogo2 from './images/newlogo2.png';

const Header = () => {
  const logos = [newlogo1, newlogo2];
  const [logoIndex, setLogoIndex] = useState(0);
  const [latestId, setLatestId]   = useState(null);

  // 1초마다 로고 교체
  useEffect(() => {
    const iv = setInterval(() => {
      setLogoIndex(i => (i + 1) % logos.length);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // 최신 설교 ID 조회 (size:1000 추가) :contentReference[oaicite:0]{index=0}
  useEffect(() => {
    axios.get('/api/sermons', {
      params: {
        page: 0,
        size: 1000,
        includeDeleted: false
      }
    })
    .then(res => {
      const all = res.data.content
        .slice()
        .sort((a, b) => b.id - a.id);
      if (all.length) setLatestId(all[0].id);
    })
    .catch(console.error);
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
                src={logos[logoIndex]}
                alt="교회 로고"
                className="logo-image"
              />
            </Link>
          </div>

          {/* 네비게이션 메뉴 (CSS 그대로 유지) */}
          <nav className="nav-menu">
            <Link to="/church-intro" className="menu-item">
              교회소개
            </Link>
            {/* 최신 설교 상세로 이동 */}
            {latestId ? (
              <Link
                to={`/worship-media/${latestId}`}
                className="menu-item"
              >
                예배 미디어
              </Link>
            ) : (
              <Link to="#" className="menu-item">
                예배 미디어
              </Link>
            )}
            <Link to="/mission" className="menu-item">
              소식 나눔
            </Link>
          </nav>

          {/* 햄버거 (모바일) */}
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
