// src/components/SermonSection.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SermonSection.css';

import sumImage  from './images/sum.png';
import sum2Image from './images/sum2.png';

import iconImage  from './images/001.png';
import iconImage2 from './images/002.png';
import iconImage3 from './images/004.png';
import iconImage4 from './images/007.png';
import iconImage5 from './images/013.png';
import iconImage6 from './images/005.png';

import new1 from './images/new1.png';
import new2 from './images/new2.png';
import new3 from './images/new3.png';
import new4 from './images/new4.png';
import new5 from './images/new5.png';
import new6 from './images/new6.png';

import newnew1 from './images/newnew1.png';
import newnew2 from './images/newnew2.png';
import newnew3 from './images/newnew3.png';
import newnew4 from './images/newnew4.png';
import newnew5 from './images/newnew5.png';
import newnew6 from './images/newnew6.png';

export default function SermonSection() {
  const navigate = useNavigate();
  const [sermons, setSermons]       = useState([]);
  const [thumbIndex, setThumbIndex] = useState(0);
  const [iconIndex, setIconIndex]   = useState(0);

  // 설교 데이터 충분히 많이 가져오기
  useEffect(() => {
    axios.get('/api/sermons', {
      params: { page: 0, size: 1000, includeDeleted: false }
    })
    .then(res => setSermons(res.data.content))
    .catch(console.error);
  }, []);

  // 1.5초마다 썸네일·아이콘 순환
  useEffect(() => {
    const iv = setInterval(() => {
      setThumbIndex(i => (i + 1) % 2);
      setIconIndex(i => (i + 1) % 3);
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  // 최신 설교 한 건
  const latest = sermons.slice().sort((a, b) => b.id - a.id)[0];

  // 클릭 시 최신 상세로 이동
  const goToLatest = () => {
    if (latest) navigate(`/worship-media/${latest.id}`);
  };

  // 유튜브 채널 URL (새 탭으로 열기)
  const youtubeChannelUrl = 'https://www.youtube.com/@%EB%B0%A9%ED%99%94%EC%B9%A8%EB%A1%80%EA%B5%90%ED%9A%8C';

  // 내부 라우트 + 특별 처리용 '/youtube'
  const paths = [
    '/church-intro',
    '/location',
    '/worship-info',
    '/posts',
    '/church-history',
    '/youtube'
  ];

  const icons      = [iconImage, iconImage2, iconImage3, iconImage4, iconImage5, iconImage6];
  const iconsNew   = [new1,      new2,      new3,      new4,      new5,      new6];
  const iconsNewNew= [newnew1,   newnew2,   newnew3,   newnew4,   newnew5,   newnew6];

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
                  src={thumbIndex === 0 ? sumImage : sum2Image}
                  alt="주일설교 썸네일"
                  className="feature-thumbnail"
                />
              </div>
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
              <p style={{ fontSize: '22px', margin: '6px 0' }}>
                하나님이 찾으시는 교회
              </p>
              <p style={{ fontSize: '22px', margin: '6px 0' }}>
                기독교한국침례회 방화침례교회입니다
              </p>
              <p style={{ fontSize: '16px', margin: '6px 0', marginTop: '20px' }}>
                복음으로, 은혜로, 사랑으로, 믿음으로
              </p>
              <p style={{ fontSize: '16px', margin: '6px 0' }}>
                하나님을 만나길 간절히 소망합니다
              </p>
            </div>
            {icons.map((orig, idx) => {
              const src = iconIndex === 0
                ? orig
                : iconIndex === 1
                  ? iconsNew[idx]
                  : iconsNewNew[idx];
              return (
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
                  <img src={src} className="icon-image" alt="" />
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
