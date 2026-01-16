// src/pages/ChurchIntroPage.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import introImg from '../components/images/intro.png';
import topBanner from '../components/images/top_banner1.png';
import './ChurchIntroPage.css';

function ChurchIntroPage() {
  return (
    <>
      {/* ─── 상단 배너 박스 (이미지) ─── */}
      <div className="intro-banner">
        <div className="intro-banner-inner">
          <img src={topBanner} alt="교회소개 배너" className="banner-image" />
        </div>
      </div>

      {/* ─── 탭 메뉴 ─── */}
      <nav className="intro-tabs">
        <div className="intro-tabs-inner">
          <NavLink
            to="/church-intro"
            className={({ isActive }) => (isActive ? 'tab-item active' : 'tab-item')}
          >
            교회소개
          </NavLink>
          <NavLink
            to="/church-history"
            className={({ isActive }) => (isActive ? 'tab-item active' : 'tab-item')}
          >
            교회연혁
          </NavLink>
          <NavLink
            to="/worship-info"
            className={({ isActive }) => (isActive ? 'tab-item active' : 'tab-item')}
          >
            예배안내
          </NavLink>
          <NavLink
            to="/location"
            className={({ isActive }) => (isActive ? 'tab-item active' : 'tab-item')}
          >
            오시는길
          </NavLink>
        </div>
      </nav>

      {/* ─── 콘텐츠 영역 ─── */}
      <div className="intro-container page-container">
        {/* ─── 본문 임시 컨텐츠 ─── */}
        <section className="intro-content">
          <h2>방화침례교회는,</h2>
          <p>
            이곳에 교회 소개 텍스트가 들어갑니다. 교회의 비전, 역사, 목사님 인사말 등을 이곳에 작성해 주세요.
          </p>
        </section>

        {/* ─── 이미지 + 텍스트 피처 블록 ─── */}
        <section className="intro-feature">
          <div className="feature-image">
            <img
              src={introImg}
              alt="교회 전경"
            />
          </div>
          <div className="feature-text">
            <h2>메인 슬로건?.</h2>
            <p>
              방화침례교회는 블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라
              블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라
              블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라블라
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

export default ChurchIntroPage;