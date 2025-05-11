// src/pages/WorshipMediaPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './WorshipMediaPage.css';

const TABS = [
  { key: 'sunday', label: '주일예배' },
];

function extractYoutubeId(url) {
  const regex = /(?:\?v=|\/embed\/|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : '';
}

export default function WorshipMediaPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('sunday');
  const [allItems, setAllItems]   = useState([]);    // 전체 데이터
  const [list, setList]           = useState([]);    // 사이드바용 4개
  const [selected, setSelected]   = useState(null);  // 상세 데이터

  // 1) 전체 데이터 한 번에 가져오기
  useEffect(() => {
    axios.get('/api/sermons', {
      params: { page: 0, size: 1000, includeDeleted: false }
    })
    .then(res => setAllItems(res.data.content))
    .catch(console.error);
  }, []);

  // 2) URL의 id가 바뀔 때 상세 가져오기
  useEffect(() => {
    if (!id) return;
    axios.get(`/api/sermons/${id}`)
      .then(res => setSelected(res.data))
      .catch(console.error);
  }, [id]);

  // 3) selected 또는 allItems가 바뀔 때마다 사이드바 목록 재구성
  useEffect(() => {
    if (!selected || allItems.length === 0) return;

    const related = allItems
      .filter(item => item.id <= selected.id)    // 선택된 설교와 그 이전
      .sort((a, b) => b.id - a.id)                // 최신순
      .slice(0, 4);

    setList(related);
  }, [selected, allItems]);

  // 로딩 처리
  if (!selected) {
    return <div className="page-container">로딩 중…</div>;
  }

  const videoId  = extractYoutubeId(selected.youtubeUrl);
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="media-container page-container">
      {/* 상단 타이틀 & 서브메뉴 */}
      <h1 className="page-title">예배와 훈련</h1>
      <nav className="location-submenu">
        <ul>
          {TABS.map(tab => (
            <li key={tab.key}>
              <button
                className={activeTab === tab.key ? 'active' : undefined}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 주일예배 헤더 */}
      {activeTab === 'sunday' && (
        <div className="sermon-header">
          <h2 className="sermon-title">
            {selected.title} <span className="ref">({selected.bibleText})</span>
          </h2>
          <p className="sermon-meta">
            {new Date(selected.sermonDate).toLocaleDateString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit'
            })} | {selected.preacher}
          </p>
        </div>
      )}

      {/* 비디오 + 사이드바 */}
      <div className="media-content">
        <div className="media-main">
          <div className="video-wrapper">
            <iframe
              title={selected.title}
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
                onClick={() => navigate(`/worship-media/${item.id}`)}
              >
                <span className="date">
                  {new Date(item.sermonDate).toLocaleDateString('en-US', {
                    month: '2-digit', day: '2-digit'
                  })}
                </span>
                <div className="item">
                  <strong>{item.title}</strong>
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

      {/* 스크립트 (주일예배 탭) */}
      {activeTab === 'sunday' && (
        <div className="media-transcript">
          <h3>설교본문 | {selected.bibleText} 말씀</h3>
          {selected.transcriptLines?.map((line, i) => (
            <p key={i}>
              <strong>{line.ref}</strong> {line.text}
            </p>
          ))}
        </div>
      )}

      {/* 다른 탭 준비중 안내 */}
      {activeTab !== 'sunday' && (
        <div className="placeholder">
          <p>
            “{TABS.find(t => t.key === activeTab).label}” 콘텐츠는<br/>
            준비 중입니다.
          </p>
        </div>
      )}
    </div>
  );
}
