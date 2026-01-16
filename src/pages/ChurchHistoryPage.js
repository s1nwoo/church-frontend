// src/pages/ChurchHistoryPage.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import topBanner from '../components/images/top_banner2.png';
import './ChurchHistoryPage.css';
import './ChurchIntroPage.css';

export default function ChurchHistoryPage() {
  return (
    <>
      {/* ─── 상단 배너 박스 (이미지 + 텍스트) ─── */}
      <div className="intro-banner">
        <div className="intro-banner-inner">
          <img src={topBanner} alt="교회연혁 배너" className="banner-image" />
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
        {/* ─── 본문 연혁 설명 ─── */}
        <div className="history-description">
          <p>방화침례교회는 XXXX년 XX월 강서구 방화동에서 시작되었습니다.</p>
          <p>XXXX년 블라블라블라블라블라블라블라블라,</p>
          <p>XXXX년 블라블라블라블라블라블라블라블라.</p>
          <p>XXXX년 블라블라블라블라블라블라블라블라</p>
          <p>XXXX년 선블라블라블라블라블라블라블라블라.</p>
        </div>

        {/* ─── 연혁 타임라인 ─── */}
        <div className="history-timeline">
          <div className="timeline-item">
            <div className="timeline-year">2023</div>
            <div className="timeline-content">
              <p>세계선교의 원년</p>
              <p>5월 임직감사예배 및 전교인 선교 제비뽑기</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-year">2022</div>
            <div className="timeline-content">
              <p>김포 트리라운지, 팜라인 예원 미션 센터 및 DMC 개원</p>
              <p>본당 헌당 및 설립 35주년 감사예배</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-year">2021</div>
            <div className="timeline-content">
              <p>퍼스트 무버, 러스트 천</p>
              <p>김포 트리라운지 설립</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}