// src/components/SermonSection.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SermonSection.css';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────
// 1) 임시 썸네일 이미지 import
// src/components/images/sum.png 파일을 준비해 주세요
import sumImage from './images/sum.png';
// ─────────────────────────────────────────────────────────

const SermonSection = () => {
  const [sermons, setSermons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('/api/sermons')
      .then(res => setSermons(res.data.content))
      .catch(err => console.error(err));
  }, []);

  const latest = sermons.sort((a, b) => b.id - a.id)[0];

  return (
    <section className="sermon-section">
      <div className="page-container">
        <div className="sermon-layout">
          {latest && (
            <div className="sermon-feature">
              {/* 헤더 */}
              <div className="feature-header">
                <div className="feature-header-small">WORSHIP</div>
                <h3 className="feature-header-title">금주의 주일설교</h3>
              </div>

              {/* ─────────────────────────────────────────────── */}
              {/* 2) 여기서 유튜브 URL 대신 임시 이미지 사용 */}
              <div
                className="feature-video-wrapper"
                onClick={() => navigate(`/sermons/${latest.id}`)}
              >
                <img
                  src={sumImage}
                  alt="임시 썸네일"
                  className="feature-thumbnail"
                />
              </div>
              {/* ─────────────────────────────────────────────── */}

              {/* 원래는 아래와 같이 Dynamic YouTube 썸네일을 사용했습니다.
                  나중에 복원할 때는 주석을 해제하고 위 부분을 주석 처리하세요. */}
              {/*
              <div
                className="feature-video-wrapper"
                onClick={() => navigate(`/sermons/${latest.id}`)}
              >
                <img
                  src={`https://img.youtube.com/vi/${extractYoutubeId(latest.youtubeUrl)}/0.jpg`}
                  alt={latest.title}
                  className="feature-thumbnail"
                />
              </div>
              */}

              {/* 메타 & 버튼 */}
              <div className="feature-meta">
                <div className="meta-info">
                  <h4 className="meta-title">{latest.title}</h4>
                  {latest.bibleText && (
                    <p className="meta-subtitle">{latest.bibleText}</p>
                  )}
                  <p className="meta-detail">
                    {latest.sermonDate} · {latest.preacher}
                  </p>
                </div>
                <button
                  className="feature-button"
                  onClick={() => navigate('/sermons')}
                >
                  주일설교 전체보기
                </button>
              </div>
            </div>
          )}

          {/* 오른쪽 이모지 버튼 */}
          <div className="sermon-emoji-buttons">
            <div className="emoji-button" onClick={() => navigate('/sermons')}>
              <div className="emoji">📖</div>
              <div className="label">말씀과 찬양</div>
            </div>
            <div className="emoji-button" onClick={() => navigate('/newcomer')}>
              <div className="emoji">👋</div>
              <div className="label">등록안내</div>
            </div>
            <div className="emoji-button" onClick={() => navigate('/bulletin')}>
              <div className="emoji">📰</div>
              <div className="label">교회주보</div>
            </div>
            <div className="emoji-button" onClick={() => navigate('/contact')}>
              <div className="emoji">🙏</div>
              <div className="label">목회자와의 소통</div>
            </div>
            <div className="emoji-button" onClick={() => navigate('/contact')}>
              <div className="emoji">🙏</div>
              <div className="label">목회자와의 소통</div>
            </div>
            <div className="emoji-button" onClick={() => navigate('/contact')}>
              <div className="emoji">🙏</div>
              <div className="label">목회자와의 소통</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function extractYoutubeId(url) {
  const regex = /(?:\?v=|\/embed\/|\/watch\?v=|youtu\.be\/)([\w-]{11})/;
  const m = url.match(regex);
  return m ? m[1] : '';
}

export default SermonSection;
