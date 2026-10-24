// src/pages/WorshipMediaPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { WORSHIP_TABS as TABS, tabForWorshipType, worshipTypeForTab, worshipTypeLabel } from '../utils/worshipTypes';
import axios from 'axios';
import bannerImg5 from '../components/images/top_banner_img5.png'; /* 주일예배 배너 우측 일러스트 */
import bannerImg6 from '../components/images/top_banner_img6.png'; /* 공동체영상 배너 우측 일러스트 */
import './WorshipMediaPage.css';
import './ChurchIntroPage.css';


// YouTube URL에서 11자리 ID만 추출
function extractYoutubeId(url) {
  const regex = /(?:\?v=|\/embed\/|youtu\.be\/)([\w-]{11})/;
  const match = (url || '').match(regex);
  return match ? match[1] : '';
}

export default function WorshipMediaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const scrollPositionRef = useRef(0); // 스크롤 위치 저장
  const isNavigatingRef = useRef(false); // 네비게이션 중인지 체크

  const [searchParams] = useSearchParams();
  const requestedTab = TABS.some(tab => tab.key === searchParams.get('tab')) ? searchParams.get('tab') : 'sunday';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allItems,   setAllItems] = useState([]);   // 전체 데이터
  const [list,       setList]     = useState([]);   // 사이드바용 최신 4개 (고정)
  const [selected,   setSelected] = useState(null); // 상세 데이터

  // 같은 예배 구분의 영상만 관련 목록에 표시한다.
  const activeTab = id && selected ? tabForWorshipType(selected.worshipType) : requestedTab;
  const selectedWorshipType = id ? (selected ? selected.worshipType || 'SUNDAY' : null) : worshipTypeForTab(activeTab);
  const isCommunity = activeTab === 'community';
  useEffect(() => {
    let cancelled = false;
    if (!selectedWorshipType) return;
    setAllItems([]);
    setList([]);
    axios.get('/api/sermons', {
      params: { page: 0, size: 1000, includeDeleted: false, worshipType: selectedWorshipType }
    })
    .then(res => { if (!cancelled) setAllItems(res.data.content || []); })
    .catch(console.error);
    return () => { cancelled = true; };
  }, [selectedWorshipType]);

  // 탭 진입은 해당 유형의 최신 영상, ID 링크는 지정한 영상을 재생한다.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSelected(null);
    const loadVideo = async () => {
      let videoId = id;
      if (!videoId) {
        const response = await axios.get('/api/sermons', {
          params: { page: 0, size: 1, includeDeleted: false, worshipType: worshipTypeForTab(requestedTab) }
        });
        if (cancelled) return;
        videoId = response.data.content?.[0]?.id;
      }
      if (!videoId) return;
      const response = await axios.get(`/api/sermons/${videoId}`);
      if (!cancelled) setSelected(response.data);
    };
    loadVideo()
      .catch(() => {
        if (!cancelled) {
          setSelected(null);
          setError('영상을 불러오지 못했습니다. 목록에서 다시 선택해주세요.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, requestedTab]);

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
    if (allItems.length === 0 || !selected) {
      setList([]);
      return;
    }

    // API의 설교 날짜 최신순을 뒤집어 현재 영상의 전후 목록을 찾는다.
    const sorted = allItems
      .filter(item => (item.worshipType || 'SUNDAY') === selectedWorshipType)
      .slice().reverse();

    // 현재 글의 인덱스 찾기
    const currentIndex = sorted.findIndex(s => s.id === selected.id);

    if (currentIndex === -1) {
      // 현재 글을 찾지 못한 경우 최신 4개
      setList(sorted.slice().reverse().slice(0, 4));
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
  }, [allItems, selected, selectedWorshipType]);

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


  const videoId  = selected && extractYoutubeId(selected.youtubeUrl);
  const embedUrl = selected && `https://www.youtube.com/embed/${videoId}`;

  // 탭에 따른 배너 설정
  const bannerConfig = {
    sunday: {
      decoImg: bannerImg5,         /* 우측 일러스트 이미지 */
      bgClass: 'banner-worship-sunday', /* CSS에서 배경색 #FFD9E6 적용 */
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
      decoImg: bannerImg6,         /* 우측 일러스트 이미지 */
      bgClass: 'banner-worship-community', /* CSS에서 배경색 #FFB5CE 적용 */
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

      <div className="intro-container page-container">
        {/* ─── 예배 영상 상세 + 같은 예배의 리스트 ─── */}
        {loading && <p role="status">로딩 중…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && !selected && (
          <div className="worship-empty">
            <p>아직 등록된 {activeTab === 'community' ? '공동체' : worshipTypeLabel(worshipTypeForTab(activeTab))} 영상이 없습니다.</p>
            <button className="view-all" onClick={() => navigate(`/worship-media/all?tab=${activeTab}`)}>전체목록</button>
          </div>
        )}
        {!loading && !error && selected && (
          <>
            {/* 설교 헤더 */}
            <div className="sermon-header">
              <h2 className="sermon-title">
                {selected.content} {!isCommunity && selected.bibleText && <span className="ref">({selected.bibleText})</span>}
              </h2>
              <p className="sermon-meta">
                {new Date(selected.sermonDate).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: '2-digit', day: '2-digit'
                })}{!isCommunity && selected.preacher && ` | ${selected.preacher}`}
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
                        {!isCommunity && <small>{item.preacher}</small>}
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  className="view-all"
                  onClick={() => navigate(`/worship-media/all?tab=${activeTab}`)}
                >
                  전체목록
                </button>
              </aside>
            </div>

            {/* 공동체영상에는 설교본문을 표시하지 않는다. */}
            {!isCommunity && <>
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
            </>}
          </>
        )}

      </div>
    </>
  );
}
