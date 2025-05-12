// src/pages/ChurchHistoryPage.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './ChurchHistoryPage.css';
import './ChurchIntroPage.css';  // intro-submenu 스타일을 그대로 가져오기 위해

export default function ChurchHistoryPage() {
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
              to="/church-history"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              교회연혁
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
  );
}
