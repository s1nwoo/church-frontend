// src/components/SermonSection.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SermonSection.css';
import { useNavigate } from 'react-router-dom';

// ── 썸네일 이미지 ──
import sumImage  from './images/sum.png';
import sum2Image from './images/sum2.png';

// ── 원본 아이콘 (001~006) ──
import iconImage  from './images/001.png';
import iconImage2 from './images/002.png';
import iconImage3 from './images/004.png';
import iconImage4 from './images/007.png';
import iconImage5 from './images/013.png';
import iconImage6 from './images/005.png';

// ── 첫 번째 교차 아이콘 (new1~new6) ──
import new1 from './images/new1.png';
import new2 from './images/new2.png';
import new3 from './images/new3.png';
import new4 from './images/new4.png';
import new5 from './images/new5.png';
import new6 from './images/new6.png';

// ── 두 번째 교차 아이콘 (newnew1~newnew6) ──
import newnew1 from './images/newnew1.png';
import newnew2 from './images/newnew2.png';
import newnew3 from './images/newnew3.png';
import newnew4 from './images/newnew4.png';
import newnew5 from './images/newnew5.png';
import newnew6 from './images/newnew6.png';

const SermonSection = () => {

  const navigate = useNavigate();

  const [sermons, setSermons]     = useState([]);
  const [thumbIndex, setThumbIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);

  // 설교 데이터 로드
  useEffect(() => {
    axios.get('/api/sermons')
      .then(res => setSermons(res.data.content))
      .catch(err => console.error(err));
  }, []);

  // 2초마다 썸네일(2단계)과 아이콘(3단계) 순환
  useEffect(() => {
    const id = setInterval(() => {
      setThumbIndex(i => (i + 1) % 2);
      setIconIndex(i => (i + 1) % 3);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const latest = sermons.sort((a, b) => b.id - a.id)[0];
  const paths = [
    '/guide',
    '/location',
    '/news',
    '/worship',
    '/history',
    '/youtube'
  ];
  // 아이콘 상태별 배열
  const icons      = [iconImage,  iconImage2,  iconImage3,  iconImage4,  iconImage5,  iconImage6];
  const iconsNew   = [new1,       new2,         new3,         new4,         new5,         new6];
  const iconsNewNew= [newnew1,    newnew2,      newnew3,      newnew4,      newnew5,      newnew6];

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

              {/* 썸네일: sum.png ↔ sum2.png */}
              <div
                className="feature-video-wrapper"
                onClick={() => navigate(`/worship-media`)}
              >
                <img
                  src={thumbIndex === 0 ? sumImage : sum2Image}
                  alt="주일설교 썸네일"
                  className="feature-thumbnail"
                />
              </div>

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
            <div className="emoji-header">
              <p style={{ fontSize: '22px', margin: '6px 0' }}>
                하나님이 찾으시는 교회
              </p>
              <p style={{ fontSize: '22px', margin: '6px 0' }}>
                기독교한국침례회 방화침례교회입니다
              </p>
              <p style={{ fontSize: '16px', margin: '6px 0', marginTop:'20px' }}>
                복음으로, 은혜로, 사랑으로, 믿음으로
              </p>
              <p style={{ fontSize: '16px', margin: '6px 0' }}>
                하나님을 만나길 간절히 소망합니다
              </p>
            </div>

            {/* 6개 아이콘: iconIndex에 따라 0,1,2 상태 교차 */}
            {icons.map((orig, idx) => {
              let src;
              if (iconIndex === 0) src = orig;
              else if (iconIndex === 1) src = iconsNew[idx];
              else src = iconsNewNew[idx];

              return (
                <div
                  key={idx}
                  className="emoji-button"
                  onClick={() => navigate(paths[idx])}
                >
                  <img
                    src={src}
                    alt=""
                    className="icon-image"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SermonSection;
