// src/components/SermonSection.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SermonSection.css';
import { useNavigate } from 'react-router-dom';

const SermonSection = () => {
  const [sermons, setSermons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/sermons')
      .then(res => setSermons(res.data.content))
      .catch(err => console.error(err));
  }, []);

  const latestSermon = sermons.sort((a, b) => b.id - a.id)[0];

  return (
    <section className="sermon-section">
      <div className="page-container">
        <h2>설교 · 찬양</h2>
        <div className="sermon-layout">
          {latestSermon && (
            <div
              className="sermon-feature"
              onClick={() => navigate(`/sermons/${latestSermon.id}`)}
            >
              {/* 헤더 */}
              <div className="feature-header">
                <div className="feature-header-small">WORSHIP</div>
                <h2 className="feature-header-title">금주의 주일설교</h2>
              </div>

              {/* 썸네일 */}
              <img
                src={`https://img.youtube.com/vi/${extractYoutubeId(latestSermon.youtubeUrl)}/0.jpg`}
                alt={latestSermon.title}
                className="feature-thumbnail"
              />

              {/* 메타 */}
              <div className="feature-meta">
                <h3>{latestSermon.title}</h3>
                {latestSermon.bibleText && (
                  <p className="subtitle">{latestSermon.bibleText}</p>
                )}
                <p className="preacher">
                  {latestSermon.sermonDate} · {latestSermon.preacher}
                </p>
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
          </div>
        </div>
      </div>
    </section>
  );
};

function extractYoutubeId(url) {
  const regex = /(?:\?v=|\/embed\/|\/watch\?v=|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : '';
}

export default SermonSection;
