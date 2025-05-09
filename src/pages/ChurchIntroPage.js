// src/pages/ChurchIntroPage.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import introImg from '../components/images/intro.png';  // ← 이미지 import
import './ChurchIntroPage.css';

function ChurchIntroPage() {
  return (
    <div className="intro-container page-container">
      {/* ─── 상단 대제목 ─── */}
      <h1 className="page-title">교회안내</h1>

      {/* ─── 소메뉴 ─── */}
      <nav className="intro-submenu">
        <ul>
          <li>
            <NavLink
              to="/church-intro"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              교회소개
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/worship-info"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              예배안내
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/location"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              오시는 길
            </NavLink>
          </li>
        </ul>
      </nav>


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
            src={introImg}            // ← 바뀐 부분
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
  );
}

export default ChurchIntroPage;
