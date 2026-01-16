// src/pages/AllSermonsPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import topBanner5 from '../components/images/top_banner5.png';
import topBanner6 from '../components/images/top_banner6.png';
import './AllSermonsPage.css';
import './ChurchIntroPage.css';

const TABS = [
  { key: 'sunday',  label: '주일예배' },
  { key: 'community', label: '공동체영상' },
];

export default function AllSermonsPage() {
  const [activeTab, setActiveTab] = useState('sunday');
  const [list, setList]           = useState([]);
  const navigate = useNavigate();

  // 탭 변경 또는 마운트 시 전체 목록 불러오기
  useEffect(() => {
    if (activeTab !== 'sunday') {
      // 공동체영상일 땐 API 호출 안 함
      setList([]);
      return;
    }
    axios.get('/api/sermons', {
      params: {
        page: 0,
        size: 1000,
        includeDeleted: false,
        keyword: ''
      }
    })
    .then(res => {
      const items = res.data.content
        .slice()
        .sort((a, b) => b.id - a.id);
      setList(items);
    })
    .catch(console.error);
  }, [activeTab]);

  // 탭에 따른 배너 설정
  const bannerConfig = {
    sunday: {
      image: topBanner5,
      title: '주일예배',
      subtitle: '방화침례교회 설교 영상을 시청하세요\n하나님의 말씀으로 은혜받는 시간'
    },
    community: {
      image: topBanner6,
      title: '공동체 영상',
      subtitle: '공동체 안에서 역사하신 하나님의 은혜를 나눕니다\n교제의 기쁨과 감사의 순간'
    }
  };

  const currentBanner = bannerConfig[activeTab] || bannerConfig.sunday;

  return (
    <>
      {/* ─── 상단 배너 박스 (이미지 + 텍스트) ─── */}
      <div className="intro-banner">
        <div className="intro-banner-inner">
          <img src={currentBanner.image} alt={`${currentBanner.title} 배너`} className="banner-image" />
          <div className="banner-text-overlay">
            <h1 className="banner-overlay-title">{currentBanner.title}</h1>
            <p className="banner-overlay-subtitle">
              {currentBanner.subtitle.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < currentBanner.subtitle.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 탭 메뉴 (주일예배/공동체영상) ─── */}
      <nav className="intro-tabs">
        <div className="intro-tabs-inner">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'tab-item active' : 'tab-item'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── 콘텐츠 영역 (흰색 박스) ─── */}
      <div className="intro-container page-container">
        {/* ─── 주일예배 목록 ─── */}
        {activeTab === 'sunday' && (
          <ul className="sermon-list">
            {list.map(item => (
              <li
                key={item.id}
                onClick={() => navigate(`/worship-media/${item.id}`)}
              >
                <div className="left">
                  <p className="title">
                    {item.content}
                    {item.bibleText && (
                      <span className="ref">({item.bibleText})</span>
                    )}
                  </p>
                </div>
                <div className="right">
                  <p className="meta">
                    {new Date(item.sermonDate).toLocaleDateString('ko-KR', {
                      year:   'numeric',
                      month:  '2-digit',
                      day:    '2-digit'
                    })}
                    &nbsp;|&nbsp;{item.preacher}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* ─── 공동체영상 그리드 ─── */}
        {activeTab === 'community' && (
          <div className="community-videos">
            <div className="video-grid">
              {/* 임시 비디오 카드 8개 */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <div key={num} className="video-card">
                  <div className="video-thumbnail">
                    <div className="thumbnail-placeholder">영상 {num}</div>
                    <span className="video-duration">0:30</span>
                  </div>
                  <h3 className="video-title">공동체 영상 제목 {num}</h3>
                  <p className="video-date">2025.01.{10 + num}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}