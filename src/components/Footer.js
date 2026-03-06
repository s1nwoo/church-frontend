// src/components/Footer.js
import React, { useEffect, useState } from 'react';
import './Footer.css';

const Footer = () => {
  // 오늘 방문자 수
  const [todayCount, setTodayCount] = useState(null);
  // 전체 누적 방문자 수
  const [totalCount, setTotalCount] = useState(null);

  useEffect(() => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

    // 오늘 날짜 (예: "2026-03-07")
    const today = new Date().toISOString().slice(0, 10);
    // localStorage에 저장된 마지막 방문 날짜
    const lastVisitDate = localStorage.getItem('visitor_date');

    if (lastVisitDate !== today) {
      // 오늘 아직 방문 안 한 경우 → 카운트 증가 API 호출
      fetch(`${API_BASE}/api/visitor/count`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          setTodayCount(data.today);
          setTotalCount(data.total);
          // 오늘 날짜 저장 (자정이 지나면 다시 카운트됨)
          localStorage.setItem('visitor_date', today);
        })
        .catch(() => {
          // API 실패 시 조회만 시도
          fetchCountOnly(API_BASE);
        });
    } else {
      // 오늘 이미 방문한 경우 → 증가 없이 현재 수치만 조회
      fetchCountOnly(API_BASE);
    }
  }, []);

  // 카운트 증가 없이 현재 수치만 조회
  const fetchCountOnly = (API_BASE) => {
    fetch(`${API_BASE}/api/visitor/count`)
      .then(res => res.json())
      .then(data => {
        setTodayCount(data.today);
        setTotalCount(data.total);
      })
      .catch(() => {});
  };

  return (
    <footer className="footer">
      <div className="page-container">
        <div className="footer-top">
          <span>©Banghwa Baptist Church. All Rights Reserved.</span>
          <div className="footer-links">
            <a href="#약관">이용약관</a>
            <a href="#개인정보">개인정보처리방침</a>
            <a href="#안내">이용안내</a>
          </div>
        </div>

        {/* 방문자 카운터 */}
        <div className="footer-visitor">
          <span className="visitor-item">
            오늘 방문자
            <strong>{todayCount !== null ? todayCount.toLocaleString() : '-'}</strong>
            명
          </span>
          <span className="visitor-divider">|</span>
          <span className="visitor-item">
            전체 방문자
            <strong>{totalCount !== null ? totalCount.toLocaleString() : '-'}</strong>
            명
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;