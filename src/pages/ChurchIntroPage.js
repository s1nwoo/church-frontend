// src/pages/ChurchIntroPage.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import topBanner from '../components/images/top_banner1.png';
import topBannerMobile from '../components/images/top_app_banner1.png'; /* 모바일용 배너 */
import churchIllust from '../components/images/intro.png';
import pastorImage from '../components/images/intro2.png';
import './ChurchIntroPage.css';

function ChurchIntroPage() {
  return (
    <>
      {/* ─── 상단 배너 박스 (이미지 + 텍스트) ─── */}
      <div className="intro-banner">
        <div className="intro-banner-inner">
          <picture>
            <source media="(max-width: 768px)" srcSet={topBannerMobile} />
            <img src={topBanner} alt="교회소개 배너" className="banner-image" fetchpriority="high" loading="eager" />
          </picture>
          <div className="banner-text-overlay">
            <h1 className="banner-overlay-title">교회소개</h1>
            <p className="banner-overlay-subtitle">
              방화침례교회를 소개합니다<br />
              하나님의 사랑과 은혜가 넘치는 교회
            </p>
          </div>
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
        {/* ─── 교회 소개 헤더 ─── */}
        <section className="intro-header-section">
          <h2 className="intro-hero-title">방화침례교회는,</h2>
          <p className="intro-hero-text">
            작지만 역사와 전통 위에 굳게 세워진, 믿음의 깊이와 영적 생명력이 있는 공동체입니다.<br />
            우리는 숫자보다 본질을, 외형보다 중심을 소중히 여기며 예수님께서 설계하신<br />
            교회의 참모습을 따라 한 걸음씩 걸어가고 있습니다.
          </p>
          <br />
          <h2 className="section-subtitle">방화침례교회는 다섯 가지 소망을 품고 사역합니다.</h2>
        </section>

        {/* ─── 다섯 가지 비전 섹션 (큰 이미지 1장) ─── */}
        <section className="vision-hero-section">
          <div className="vision-full-image">
            <img src={churchIllust} alt="방화침례교회 다섯 가지 소망" />
          </div>
        </section>

        {/* ─── 공동담임목사 소개 섹션 (좌 텍스트 / 우 이미지) ─── */}
        <section className="pastor-section">
          <div className="pastor-grid">
            {/* 좌측: 타이틀 + 소개 텍스트 */}
            <div className="pastor-left">
              <h2 className="pastor-title">
                <span className="pastor-names">김성휘, 임주빈</span>
                <span className="pastor-role">담임목사</span>
              </h2>

              <div className="pastor-intro">
                <p>
                  김성휘 목사와 임주빈 목사는 북한에서 예수쟁이라는 죄목으로 순교하신 조부와<br />
                  평생 목사로 헌신하셨던 부모의 신앙을 물려받은 부부목사입니다.
                </p>
                <p>
                  임주빈 목사는 기도의 영성으로 방화침례교회를 믿음의 공동체로 이끌고 있으며,<br />
                  김성휘 목사는 부친의 유지를 따라 극동방송에서 32년간의 북방선교사역을 마치고<br />
                  방화침례교회 공동담임목사로 섬기고 있습니다.
                </p>
              </div>
            </div>

            {/* 우측: 이미지 */}
            <div className="pastor-right">
              <img src={pastorImage} alt="담임목사님" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default ChurchIntroPage;