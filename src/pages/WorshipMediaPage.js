// src/pages/WorshipMediaPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import axios from 'axios';
import topBanner5 from '../components/images/top_banner5.png';
import topBanner6 from '../components/images/top_banner6.png';
import './WorshipMediaPage.css';
import './ChurchIntroPage.css';

const TABS = [
  { key: 'sunday',  label: '주일예배' },
  { key: 'community', label: '공동체영상' },
];

// YouTube URL에서 11자리 ID만 추출
function extractYoutubeId(url) {
  const regex = /(?:\?v=|\/embed\/|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : '';
}

export default function WorshipMediaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const scrollPositionRef = useRef(0); // 스크롤 위치 저장
  const isNavigatingRef = useRef(false); // 네비게이션 중인지 체크

  const [activeTab, setActiveTab] = useState('sunday');
  const [allItems,   setAllItems] = useState([]);   // 전체 데이터
  const [list,       setList]     = useState([]);   // 사이드바용 최신 4개 (고정)
  const [selected,   setSelected] = useState(null); // 상세 데이터

  // 1) 전체 데이터 로드
  useEffect(() => {
    axios.get('/api/sermons', {
      params: { page: 0, size: 1000, includeDeleted: false }
    })
    .then(res => setAllItems(res.data.content))
    .catch(console.error);
  }, []);

  // 2) URL id가 바뀔 때 상세 데이터 로드
  useEffect(() => {
    if (!id) return;

    axios.get(`/api/sermons/${id}`)
      .then(res => {
        setSelected(res.data);
      })
      .catch(console.error);
  }, [id]);

  // 3) selected가 변경되면 스크롤 복원
  useEffect(() => {
    if (!selected) return;

    // 네비게이션 중이었다면 스크롤 복원
    if (isNavigatingRef.current) {
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
        isNavigatingRef.current = false;
      }, 100);
    }
  }, [selected]);

  // 4) selected와 allItems가 로드되면 현재 글 기준 전후 설교 표시
  useEffect(() => {
    if (allItems.length === 0 || !selected) return;

    // ID 기준 오름차순 정렬 (1, 2, 3, ... 순서)
    const sorted = allItems
      .slice()
      .sort((a, b) => a.id - b.id);

    // 현재 글의 인덱스 찾기
    const currentIndex = sorted.findIndex(s => s.id === selected.id);

    if (currentIndex === -1) {
      // 현재 글을 찾지 못한 경우 최신 4개
      setList(sorted.slice().reverse().slice(0, 4).reverse());
      return;
    }

    // 현재 글 기준 전후로 총 4개 추출
    // 현재 글 포함하여 -1, 0, +1, +2 위치
    const start = Math.max(0, currentIndex - 1);
    const end = Math.min(sorted.length, start + 4);

    // 4개가 안 되면 앞쪽으로 조정
    const finalStart = Math.max(0, end - 4);
    const relatedSermons = sorted.slice(finalStart, end);

    // 최신순으로 표시 (역순)
    setList(relatedSermons.reverse());
  }, [allItems, selected]);

  // 우측 리스트 클릭 핸들러 (스크롤 위치 고정)
  const handleListClick = (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();

    // 현재 보고 있는 글과 같으면 아무 동작 안 함
    if (selected && selected.id === itemId) return;

    // 현재 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY;
    isNavigatingRef.current = true;

    // URL만 변경
    navigate(`/worship-media/${itemId}`, { replace: true });
  };

  // 로딩 상태 (Sunday 탭용)
  if (activeTab === 'sunday' && !selected) {
    return <div className="page-container">로딩 중…</div>;
  }

  const videoId  = selected && extractYoutubeId(selected.youtubeUrl);
  const embedUrl = selected && `https://www.youtube.com/embed/${videoId}`;

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
          <img src={currentBanner.image} alt={`${currentBanner.title} 배너`} className="banner-image" fetchpriority="high" loading="eager" />
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

      <div className="intro-container page-container">
        {/* ─── Sunday 탭: 상세 + 리스트 ─── */}
        {activeTab === 'sunday' && selected && (
          <>
            {/* 설교 헤더 */}
            <div className="sermon-header">
              <h2 className="sermon-title">
                {selected.content} <span className="ref">({selected.bibleText})</span>
              </h2>
              <p className="sermon-meta">
                {new Date(selected.sermonDate).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: '2-digit', day: '2-digit'
                })} | {selected.preacher}
              </p>
            </div>

            {/* 비디오 + 사이드바 */}
            <div className="media-content">
              <div className="media-main">
                <div className="video-wrapper">
                  <iframe
                    title={selected.content}
                    src={embedUrl}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="media-resources">
                  {selected.hwpUrl && <a href={selected.hwpUrl}>녹취록 (hwp)</a>}
                  {selected.docUrl && <a href={selected.docUrl}>녹취록 (doc)</a>}
                  {selected.pdfUrl && <a href={selected.pdfUrl}>요약본 (pdf)</a>}
                  {selected.mp3Url && <a href={selected.mp3Url}>MP3</a>}
                </div>
              </div>
              <aside className="media-sidebar">
                <ul>
                  {list.map(item => (
                    <li
                      key={item.id}
                      className={selected.id === item.id ? 'active' : undefined}
                      onClick={(e) => handleListClick(e, item.id)}
                    >
                      <span className="date">
                        {new Date(item.sermonDate).toLocaleDateString('en-US', {
                          month: '2-digit', day: '2-digit'
                        })}
                      </span>
                      <div className="item">
                        <strong>{item.content}</strong>
                        <small>{item.preacher}</small>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  className="view-all"
                  onClick={() => navigate('/worship-media/all')}
                >
                  전체목록
                </button>
              </aside>
            </div>

            {/* 스크립트 + 성경구절 */}
            <div className="media-transcript">
              <h3>설교본문 | {selected.bibleText} 말씀</h3>
              {selected.transcriptLines?.map((line, i) => (
                <p key={i}><strong>{line.ref}</strong> {line.text}</p>
              ))}
            </div>
            <div className="media-transcript">
              {selected.bibleVerses && selected.bibleVerses.length > 0
                ? selected.bibleVerses.map((txt, idx) => <p key={idx}>{txt}</p>)
                : <p>성경구절 정보가 없습니다.</p>
              }
            </div>
          </>
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