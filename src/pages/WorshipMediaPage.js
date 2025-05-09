import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WorshipMediaPage.css';

const TABS = [
  { key: 'sunday',    label: '주일예배'    },
  { key: 'wednesday', label: '수요예배'    },
  { key: 'friday',    label: '금요기도회'  },
];

// YouTube URL에서 11자리 ID만 추출
function extractYoutubeId(url) {
  const regex = /(?:\?v=|\/embed\/|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : '';
}

export default function WorshipMediaPage() {
  const [activeTab, setActiveTab] = useState('sunday');
  const [list, setList]           = useState([]);
  const [selected, setSelected]   = useState(null);

  // ─── 마운트 시: 전체 받아와서 ID 내림차순 정렬 → 최신 4개만 사용 ───
  useEffect(() => {
    axios
      .get('/api/sermons', {
        params: {
          page: 0,
          includeDeleted: false,
        }
      })
      .then(res => {
        const all = res.data.content.slice();
        all.sort((a, b) => b.id - a.id);      // ID 큰 순서로 정렬
        const top4 = all.slice(0, 4);         // 상위 4개만
        setList(top4);
        if (top4.length) loadDetail(top4[0].id);
      })
      .catch(console.error);
  }, []);

  // ─── 상세 불러오기 ───
  function loadDetail(id) {
    axios
      .get(`/api/sermons/${id}`)
      .then(res => setSelected(res.data))
      .catch(console.error);
  }

  if (!selected) return <div className="page-container">로딩 중…</div>;

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

      {/* 비디오 + 사이드바 그리드 */}
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
                onClick={() => loadDetail(item.id)}
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
          <button className="view-all">전체목록</button>
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

      {/* 준비 중 안내 (그 외 탭) */}
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
