// src/pages/WorshipInfoPage.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './WorshipInfoPage.css';

function WorshipInfoPage() {
  return (
    <div className="worship-container page-container">
      {/* 상단 대제목 */}
      <h1 className="page-title">교회안내</h1>

      {/* 소메뉴 (3개) */}
      <nav className="location-submenu">
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
          <div className="service-col time">
            오후 2시
          </div>
          <div className="service-col location">성경공부</div>
        </div>
      </div>

      {/* 주중예배 섹션 */}
      <h2 className="section-title">주중예배</h2>
      <div className="service-table">
        <div className="service-row">
          <div className="service-col label">수요예배</div>
          <div className="service-col time">오전 11시</div>
          <div className="service-col location">수요예배</div>
        </div>
        <div className="service-row">
          <div className="service-col label">금요기도회</div>
          <div className="service-col time">오후 9시</div>
          <div className="service-col location">기도</div>
        </div>
      </div>
    </div>
  );
}

export default WorshipInfoPage;
