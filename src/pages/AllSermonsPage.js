// src/pages/AllSermonsPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import bannerImg5 from '../components/images/top_banner_img5.png'; /* 주일예배 배너 우측 일러스트 */
import bannerImg6 from '../components/images/top_banner_img6.png'; /* 공동체영상 배너 우측 일러스트 */
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

  // 탭에 따른 배너 설정 (예배미디어 첫 진입 배너와 동일: 배경색 + 우측 일러스트)
  const bannerConfig = {
    sunday: {
      decoImg: bannerImg5,
      bgClass: 'banner-worship-sunday',
      title: '주일예배',
      subtitle: '방화침례교회 설교 영상을 시청하세요\n하나님의 말씀으로 은혜받는 시간'
    },
    community: {
      decoImg: bannerImg6,
      bgClass: 'banner-worship-community',
      title: '공동체 영상',
      subtitle: '함께 역사하신 하나님의 은혜를 나눕니다\n교제의 기쁨과 감사의 순간'
    }
  };

  const currentBanner = bannerConfig[activeTab] || bannerConfig.sunday;

  return (
    <>
      {/* ─── 상단 배너 박스 (배경색 + 우측 일러스트) ─── */}
      <div className="intro-banner">
        <div className={`intro-banner-inner ${currentBanner.bgClass}`}>
          <img src={currentBanner.decoImg} alt="" className="banner-deco-img" fetchpriority="high" loading="eager" />
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

        {/* ─── 공동체영상 탭: 준비중 안내 ─── */}
        {activeTab === 'community' && (
          <div className="community-notice">
            <h2>공동체영상 콘텐츠는 준비중입니다.</h2>
            <p>
              유튜브 &gt; 재생목록 &gt; 공동체활동 영상에서 확인 할 수 있습니다.
            </p>
            <p>감사합니다.</p>
          </div>
        )}
      </div>
    </>
  );
}