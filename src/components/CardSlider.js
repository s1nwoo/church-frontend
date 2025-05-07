// src/components/CardSlider.js
import React, { useState, useRef, useEffect } from 'react';
import './CardSlider.css';

// [기능] 화살표 이미지 import
import allowL from './images/allow_l.png';
import allowR from './images/allow_r.png';

// [기능] 카드 이미지 import (실제 경로/파일명에 맞춰 조정)
import card1 from './images/card/card3.png';
import card2 from './images/card/card2.png';
import card3 from './images/card/card4.png';
import card4 from './images/card/card1.png';
import card5 from './images/card/card5.png';
// import card6 from './images/card/card6.png';

const ORIGINAL = [card1, card2, card3, card4, card5 /*, card6 */];
const VISIBLE = 3;
const WIDTH = 615;
const GAP = 30;
const DURATION = 500;
const CONTAINER_WIDTH = VISIBLE * WIDTH + (VISIBLE - 1) * GAP;
const CENTER_OFFSET = (CONTAINER_WIDTH - WIDTH) / 2;

const CardSlider = () => {
  const total = ORIGINAL.length;
  const extended = [...ORIGINAL, ...ORIGINAL, ...ORIGINAL];

  const [idx, setIdx] = useState(total);
  const [transOn, setTransOn] = useState(true);
  const wrapRef = useRef(null);

  // [기능] 슬라이드 이동 시 transform, transition 설정
  useEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    w.style.transition = transOn
      ? `transform ${DURATION}ms ease`
      : 'none';
    const x = (WIDTH + GAP) * idx - CENTER_OFFSET;
    w.style.transform = `translateX(-${x}px)`;
  }, [idx, transOn]);

  // [기능] 자동 재생: 컴포넌트 마운트 후 2초마다 next() 호출
  useEffect(() => {
    const play = () => {
      setIdx(i => i + 1);
      setTransOn(true);
    };
    const intervalId = setInterval(play, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // [기능] 다음/이전 이동
  const next = () => { setIdx(i => i + 1); setTransOn(true); };
  const prev = () => { setIdx(i => i - 1); setTransOn(true); };

  // [기능] 무한루프 보정
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
            <div key={i} className="slide">
              <img src={src} alt={`card-${i}`} />
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
            className={`dot ${ (idx - total) % total === i ? 'active' : '' }`}
            onClick={() => { setIdx(total + i); setTransOn(true); }}
          />
        ))}
      </div>
    </div>
  );
};

export default CardSlider;
