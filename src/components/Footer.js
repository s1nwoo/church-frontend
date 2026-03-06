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

    // 이미 이번 세션에서 카운트했는지 확인
    // sessionStorage는 브라우저 탭을 닫으면 초기화됨
    const alreadyCounted = sessionStorage.getItem('visitor_counted');

    if (!alreadyCounted) {
      // 이번 세션 첫 방문 → 카운트 증가 API 호출
      fetch(`${API_BASE}/api/visitor/count`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          setTodayCount(data.today);
          setTotalCount(data.total);
          // 세션에 방문 완료 표시 (브라우저 닫기 전까지 유지)
          sessionStorage.setItem('visitor_counted', 'true');
        })
        .catch(() => {
          // API 실패 시 조회만 시도
          fetchCountOnly(API_BASE);
        });
    } else {
      // 이미 카운트된 세션 → 증가 없이 현재 수치만 조회
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
