// src/pages/ChurchHistoryPage.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import bannerImg from '../components/images/top_banner_img2.png'; /* 배너 우측 일러스트 */
import './ChurchHistoryPage.css';
import './ChurchIntroPage.css';

export default function ChurchHistoryPage() {
  return (
    <>
      {/* ─── 상단 배너 박스 (이미지 + 텍스트) ─── */}
      <div className="intro-banner">
        <div className="intro-banner-inner banner-church-history">
          <img src={bannerImg} alt="" className="banner-deco-img" fetchpriority="high" loading="eager" />
          <div className="banner-text-overlay">
            <h1 className="banner-overlay-title">교회연혁</h1>
            <p className="banner-overlay-subtitle">
              방화침례교회의 역사를 소개합니다<br />
              하나님의 인도하심 가운데 걸어온 발자취
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

        {/* ─── 교회 연혁 타임라인 ─── */}
        <div className="history-timeline">

          {/* 1987년 */}
          <div className="timeline-item">
            <div className="timeline-year">1986</div>
            <div className="timeline-content">
              <p>3월 2일</p>
              <p>서석우 목사 군목 제대 후</p>
              <p>기독교한국침례회</p>
              <p>방화침례교회 개척</p>
            </div>
          </div>

          {/* 2017년 */}
          <div className="timeline-item">
            <div className="timeline-year">2017</div>
            <div className="timeline-content">
              <p>9월</p>
              <p>임주빈 강도사 부임 및</p>
              <p>서석우 목사 안식년</p>
              <p>필리핀 선교 파송</p>
            </div>
          </div>

          {/* 2018년 */}
          <div className="timeline-item">
            <div className="timeline-year">2018</div>
            <div className="timeline-content">
              <p>9월 9일</p>
              <p>임주빈 목사 안수</p>
              <p>(방화침례교회)</p>
            </div>
          </div>

          {/* 2021년 */}
          <div className="timeline-item">
            <div className="timeline-year">2021</div>
            <div className="timeline-content">
              <p>1월 3일</p>
              <p>임주빈 담임목사 취임 및</p>
              <p>서석우 목사 은퇴</p>
            </div>
          </div>

          {/* 2022년 */}
          <div className="timeline-item">
            <div className="timeline-year">2022</div>
            <div className="timeline-content">
              <p>3월</p>
              <p>김성휘 목사 부임 및</p>
              <p>임주빈 목사와</p>
              <p>공동담임목사 사역 시작</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}