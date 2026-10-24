// src/pages/AllSermonsPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WORSHIP_TABS as TABS, worshipTypeForTab, worshipTypeLabel } from '../utils/worshipTypes';
import axios from 'axios';
import bannerImg5 from '../components/images/top_banner_img5.png'; /* 주일예배 배너 우측 일러스트 */
import bannerImg6 from '../components/images/top_banner_img6.png'; /* 공동체영상 배너 우측 일러스트 */
import './AllSermonsPage.css';
import './ChurchIntroPage.css';


export default function AllSermonsPage() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some(tab => tab.key === requestedTab) ? requestedTab : 'sunday';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [list, setList]           = useState([]);
  const navigate = useNavigate();

  // 탭 변경 또는 마운트 시 전체 목록 불러오기
  useEffect(() => {
    setList([]);
    setError('');
    let cancelled = false;
    setLoading(true);
    axios.get('/api/sermons', {
      params: {
        page: 0,
        size: 1000,
        includeDeleted: false,
        worshipType: worshipTypeForTab(activeTab),
        keyword: ''
      }
    })
    .then(res => {
      if (!cancelled) setList(res.data.content || []);
    })
    .catch(() => {
      if (!cancelled) setError('영상 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    })
    .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab]);

  // 탭에 따른 배너 설정 (예배미디어 첫 진입 배너와 동일: 배경색 + 우측 일러스트)
  const bannerConfig = {
    sunday: {
      decoImg: bannerImg5,
      bgClass: 'banner-worship-sunday',
      title: '주일예배',
      subtitle: '방화침례교회 설교 영상을 시청하세요\n하나님의 말씀으로 은혜받는 시간'
    },
    afternoon: {
      decoImg: bannerImg5,
      bgClass: 'banner-worship-afternoon',
      title: '오후예배',
      subtitle: '오후예배 말씀을 함께 나눕니다\n하나님의 말씀으로 은혜받는 시간'
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
          <img src={currentBanner.decoImg} alt="" className="banner-deco-img" fetchPriority="high" loading="eager" />
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

      {/* ─── 탭 메뉴 (주일예배/오후예배/공동체영상) ─── */}
      <nav className="intro-tabs">
        <div className="intro-tabs-inner">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'tab-item active' : 'tab-item'}
              onClick={() => navigate(`/worship-media?tab=${tab.key}`)}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── 콘텐츠 영역 (흰색 박스) ─── */}
      <div className="intro-container page-container">
        {/* ─── 선택한 예배의 영상 목록 ─── */}
        {loading && <p role="status">로딩 중…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && list.length === 0 && (
          <p className="worship-empty">아직 등록된 {worshipTypeLabel(worshipTypeForTab(activeTab))} 영상이 없습니다.</p>
        )}
        {!loading && !error && (
          <ul className="sermon-list">
            {list.map(item => (
              <li
                key={item.id}
                onClick={() => navigate(`/worship-media/${item.id}`)}
              >
                <div className="left">
                  <p className="title">
                    {item.content}
                    {activeTab !== 'community' && item.bibleText && (
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
                    {activeTab !== 'community' && item.preacher && ` | ${item.preacher}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

      </div>
    </>
  );
}
