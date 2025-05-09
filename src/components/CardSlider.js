// src/components/CardSlider.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CardSlider.css';

import allowL from './images/allow_l.png';
import allowR from './images/allow_r.png';

import card1 from './images/card/card3.png';
import card2 from './images/card/card2.png';
import card3 from './images/card/card4.png';
import card4 from './images/card/card1.png';
import card5 from './images/card/card5.png';

const ORIGINAL = [card1, card2, card3, card4, card5];
const VISIBLE = 3;
const WIDTH = 615;
const GAP = 30;
const DURATION = 500;
const CONTAINER_WIDTH = VISIBLE * WIDTH + (VISIBLE - 1) * GAP;   // 3*615 + 2*30 = 1905
const CENTER_OFFSET = (CONTAINER_WIDTH - WIDTH) / 2;              // (1905 - 615)/2 = 645

const CardSlider = () => {
  const navigate = useNavigate();
  const total = ORIGINAL.length;
  // 원본을 세 번 반복해서 양 옆으로 무한 스크롤 효과
  const extended = [...ORIGINAL, ...ORIGINAL, ...ORIGINAL];

  const [idx, setIdx] = useState(total);
  const [transOn, setTransOn] = useState(true);
  const wrapRef = useRef(null);

    useEffect(() => {
      const w = wrapRef.current;
      if (!w) return;
    
      // 트랜지션 설정
      w.style.transition = transOn
        ? `transform ${DURATION}ms ease`
        : 'none';

      // 슬라이딩 거리 계산
      let x;

      if (window.innerWidth <= 768) {
        // ★ 모바일(≤768px)일 때: 컨테이너 너비 + gap 만큼 이동
        const container  = w.parentElement;       // .slides-container
        const slideWidth = container.offsetWidth; // 모바일에선 100% 폭
        const mobileGap  = 16;                    // CSS에서 설정한 gap 값
        x = (slideWidth + mobileGap) * (idx - total);
      } else {
        // ★ PC(>768px)일 때: 기존 로직 유지
        x = (WIDTH + GAP) * idx - CENTER_OFFSET;
      }

      w.style.transform = `translateX(-${x}px)`;
    }, [idx, transOn, total]);

  // 무한 루프 보정
  const onEnd = () => {
    if (idx >= total * 2) {
      setTransOn(false);
      setIdx(total);
    }
    if (idx < total) {
      setTransOn(false);
      setIdx(total + (idx % total));
    }
  };

  // 자동 재생 (선택사항)
  useEffect(() => {
    const play = () => {
      setIdx(i => i + 1);
      setTransOn(true);
    };
    const id = setInterval(play, 5000);
    return () => clearInterval(id);
  }, []);

  const next = () => { setIdx(i => i + 1); setTransOn(true); };
  const prev = () => { setIdx(i => i - 1); setTransOn(true); };

  const handleClick = i => {
    const cardNum = i % total;
    if (cardNum === 0) {
      window.open('https://www.youtube.com/@%EB%B0%A9%ED%99%94%EC%B9%A8%EB%A1%80%EA%B5%90%ED%9A%8C', '_blank');
    } else if (cardNum === 1) {
      navigate('/church-intro');
    } else if (cardNum === 2) {
      navigate('/location');
    } else if (cardNum === 4) {
      navigate('/worship-info');
    }
  };

  return (
    <div className="card-slider">
      <button className="arrow arrow-left" onClick={prev} aria-label="이전">
        <img src={allowL} alt="이전" />
      </button>

      <div className="slides-container">
        <div
          ref={wrapRef}
          className="slides-wrapper"
          onTransitionEnd={onEnd}
        >
          {extended.map((src, i) => (
            <div
              key={i}
              className="slide"
              style={{ cursor: 'pointer' }}
              onClick={() => handleClick(i)}
            >
              <img src={src} alt={`card-${(i % total) + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <button className="arrow arrow-right" onClick={next} aria-label="다음">
        <img src={allowR} alt="다음" />
      </button>

      <div className="dots">
        {ORIGINAL.map((_, i) => (
          <span
            key={i}
            className={`dot ${(idx - total) % total === i ? 'active' : ''}`}
            onClick={() => { setIdx(total + i); setTransOn(true); }}
          />
        ))}
      </div>
    </div>
  );
};

export default CardSlider;
