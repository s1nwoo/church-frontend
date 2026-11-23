// src/pages/ChurchHistoryPage.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import bannerImg from '../components/images/top_banner_img2.png'; /* 배너 우측 일러스트 */
import './ChurchHistoryPage.css';
import './ChurchIntroPage.css';

/* 연혁 데이터 — 항목 추가 시 여기에만 추가하면 됩니다 */
const HISTORY = [
  { year: 1987, date: '3월 2일', lines: ['서석우 목사 군목 제대 후', '기독교한국침례회', '방화침례교회 개척'] },
  { year: 2017, date: '9월',     lines: ['임주빈 강도사 부임 및', '서석우 목사 안식년', '필리핀 선교 파송'] },
  { year: 2018, date: '9월 9일', lines: ['임주빈 목사 안수', '(방화침례교회)'] },
  { year: 2021, date: '1월 3일', lines: ['임주빈 담임목사 취임 및', '서석우 목사 은퇴'] },
  { year: 2022, date: '3월',     lines: ['김성휘 목사 부임 및', '임주빈 목사와', '공동담임목사 사역 시작'] },
];

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

        {/* ─── 교회 연혁 타임라인 (가로: 선 + 원 마커 + 점선, 모바일: 세로) ─── */}
        <ol className="history-track" aria-label="방화침례교회 연혁">
          {HISTORY.map(({ year, date, lines }, i) => (
            <li className="history-item" key={year} style={{ '--i': i }}>
              <span className="history-marker" aria-hidden="true" />
              <div className="history-body">
                <p className="history-year">{year}<span>년</span></p>
                <p className="history-date">{date}</p>
                <p className="history-desc">
                  {lines.map((line, j) => (
                    <React.Fragment key={j}>{line}{j < lines.length - 1 && <br />}</React.Fragment>
                  ))}
                </p>
              </div>
            </li>
          ))}
          <li className="history-arrow" aria-hidden="true">
            <svg viewBox="0 0 52 24"><path d="M4 3 L13 12 L4 21 M18 3 L27 12 L18 21 M32 3 L41 12 L32 21" /></svg>
          </li>
        </ol>
      </div>
    </>
  );
}