// src/pages/WorshipInfoPage.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import bannerImg from '../components/images/top_banner_img3.png'; /* 배너 우측 일러스트 */
import './WorshipInfoPage.css';
import './ChurchIntroPage.css';

function WorshipInfoPage() {
  return (
    <>
      {/* ─── 상단 배너 박스 (이미지 + 텍스트) ─── */}
      <div className="intro-banner">
        <div className="intro-banner-inner banner-worship-info">
          <img src={bannerImg} alt="" className="banner-deco-img" fetchpriority="high" loading="eager" />
          <div className="banner-text-overlay">
            <h1 className="banner-overlay-title">예배안내</h1>
            <p className="banner-overlay-subtitle">
              방화침례교회 예배 시간을 안내합니다<br />
              하나님께 드리는 거룩한 예배
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
        {/* 주일예배 섹션 */}
        <h2 className="section-title">주일예배</h2>
        <div className="service-table">
          <div className="service-row">
            <div className="service-col time">오전 9시 30분</div>
            <div className="service-col location">다음세대 주일학교</div>
          </div>
          <div className="service-row">
            <div className="service-col time">오전 11시 00분</div>
            <div className="service-col location">찬양 및 오전예배</div>
          </div>
          <div className="service-row">
            <div className="service-col time">오후 1시 30분</div>
            <div className="service-col location">오후예배</div>
          </div>
          <div className="service-row">
            <div className="service-col time">오후 1시 30분</div>
            <div className="service-col location">청년부</div>
          </div>
        </div>

        {/* 주중예배 섹션 */}
        <h2 className="section-title">주중예배</h2>
        <div className="service-table">
          <div className="service-row">
            <div className="service-col time">오전 11시 00분</div>
            <div className="service-col location">수요예배</div>
          </div>
          <div className="service-row">
            <div className="service-col time">오후 9시 00분</div>
            <div className="service-col location">금요 기도회</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default WorshipInfoPage;