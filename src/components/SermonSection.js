// src/components/SermonSection.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SermonSection.css';

import iconImage  from './images/1.png';
import iconImage2 from './images/2.png';
import iconImage3 from './images/3.png';
import iconImage4 from './images/4.png';
import iconImage5 from './images/5.png';
import iconImage6 from './images/6.png';

export default function SermonSection() {
  const navigate = useNavigate();
  const [sermons, setSermons] = useState([]);
  const [thumbnail, setThumbnail] = useState(''); // 유튜브 썸네일

  // 설교 데이터 가져오기
  useEffect(() => {
    axios.get('/api/sermons', {
      params: { page: 0, size: 1000, includeDeleted: false }
    })
    .then(res => {
      const sortedSermons = res.data.content.slice().sort((a, b) => b.id - a.id);
      setSermons(sortedSermons);

      // 최신 설교의 유튜브 썸네일 추출
      if (sortedSermons.length > 0) {
        const latestSermon = sortedSermons[0];
        const videoId = extractYoutubeId(latestSermon.youtubeUrl);
        if (videoId) {
          setThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
        }
      }
    })
    .catch(console.error);
  }, []);

  // 유튜브 비디오 ID 추출 함수
  const extractYoutubeId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // 최신 설교
  const latest = sermons[0];

  // 클릭 시 최신 상세로 이동
  const goToLatest = () => {
    if (latest) navigate(`/worship-media/${latest.id}`);
  };

  // 유튜브 채널 URL
  const youtubeChannelUrl = 'https://www.youtube.com/@%EB%B0%A9%ED%99%94%EC%B9%A8%EB%A1%00%EA%B5%90%ED%9A%8C';

  // 내부 라우트
  const paths = [
    '/church-intro',
    '/location',
    '/worship-info',
    '/posts',
    '/church-history',
    '/youtube'
  ];

  const icons = [iconImage, iconImage2, iconImage3, iconImage4, iconImage5, iconImage6];

  return (
    <section className="sermon-section">
      <div className="page-container">
        <div className="sermon-layout">

          {/* 금주의 주일설교 */}
          {latest && (
            <div className="sermon-feature">
              <div className="feature-header">
                <div className="feature-header-small">WORSHIP</div>
                <h3 className="feature-header-title">금주의 주일설교</h3>
              </div>
              <div
                className="feature-video-wrapper"
                onClick={goToLatest}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={thumbnail || 'https://via.placeholder.com/800x450?text=No+Thumbnail'}
                  alt="주일설교 썸네일"
                  className="feature-thumbnail"
                />
              </div>
              <div className="feature-meta">
                <div className="meta-info">
                  {/* title → content 변경 */}
                  <h4 className="meta-title">{latest.content}</h4>
                  {latest.bibleText && (
                    <p className="meta-subtitle">{latest.bibleText}</p>
                  )}
                  <p className="meta-detail">
                    {latest.sermonDate} · {latest.preacher}
                  </p>
                </div>
                <button
                  className="feature-button"
                  onClick={() => navigate('/worship-media/all')}
                >
                  주일설교 전체보기
                </button>
              </div>
            </div>
          )}

          {/* 아이콘 버튼들 */}
          <div className="sermon-emoji-buttons">
            <div className="emoji-header">
              <p style={{ fontSize: '20px', margin: '6px 0', color: '#4B2CFF', fontWeight: 900 }}>
                "하나님이 찾으시는 교회"
              </p>

              <p style={{ fontSize: '20px', margin: '6px 0', fontWeight: 900 }}>
                <span className="hl-mid">기독교한국침례회</span> 방화침례교회입니다
              </p>

              <p style={{ fontSize: '16px', margin: '6px 0', marginTop: '20px' }}>
                복음으로, 은혜로, 사랑으로, 믿음으로
              </p>
              <p style={{ fontSize: '16px', margin: '6px 0' }}>
                하나님을 만나길 간절히 소망합니다
              </p>
            </div>

            {icons.map((icon, idx) => (
              <div
                key={idx}
                className="emoji-button"
                onClick={() => {
                  if (paths[idx] === '/youtube') {
                    window.open(youtubeChannelUrl, '_blank');
                  } else {
                    navigate(paths[idx]);
                  }
                }}
              >
                <img src={icon} className="icon-image" alt="" />
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}