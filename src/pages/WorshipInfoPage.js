// src/pages/WorshipInfoPage.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import topBanner from '../components/images/top_banner3.png';
import './WorshipInfoPage.css';
import './ChurchIntroPage.css';

function WorshipInfoPage() {
  return (
    <>
      {/* ─── 상단 배너 박스 (이미지) ─── */}
      <div className="intro-banner">
        <div className="intro-banner-inner">
          <img src={topBanner} alt="예배안내 배너" className="banner-image" />
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
        {/* 주일예배 섹션 */}
        <h2 className="section-title">주일예배</h2>
        <div className="service-table">
          <div className="service-row">
            <div className="service-col label">1부</div>
            <div className="service-col time">오전 11시</div>
            <div className="service-col location">찬양 및 예배</div>
          </div>
          <div className="service-row">
            <div className="service-col label">2부</div>
            <div className="service-col time">오후 1시 30분</div>
            <div className="service-col location">본당</div>
          </div>
        </div>

        {/* 주중예배 섹션 */}
        <h2 className="section-title">주중예배</h2>
        <div className="service-table">
          <div className="service-row">
            <div className="service-col label">수요예배</div>
            <div className="service-col time">오후 7시 30분</div>
            <div className="service-col location">본당</div>
          </div>
          <div className="service-row">
            <div className="service-col label">금요철야</div>
            <div className="service-col time">오후 10시</div>
            <div className="service-col location">본당</div>
          </div>
          <div className="service-row">
            <div className="service-col label">새벽기도회</div>
            <div className="service-col time">오전 5시 30분</div>
            <div className="service-col location">본당</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default WorshipInfoPage;