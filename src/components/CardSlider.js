// src/components/CardSlider.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CardSlider.css';

// 화살표 이미지
import allowL from './images/allow_l.png';
import allowR from './images/allow_r.png';

// 카드 이미지
import card1 from './images/card/card3.png';
import card2 from './images/card/card2.png';
import card3 from './images/card/card4.png';
import card4 from './images/card/card1.png';
import card5 from './images/card/card5.png';

const ORIGINAL = [card1, card2, card3, card4, card5];
const GAP = 30;
const DURATION = 500;

const CardSlider = () => {
  const navigate = useNavigate();
  const total = ORIGINAL.length;
  const extended = [...ORIGINAL, ...ORIGINAL, ...ORIGINAL];
  const wrapRef = useRef(null);

  // 슬라이드 상태
  const [idx, setIdx] = useState(total);
  const [transOn, setTransOn] = useState(true);

  // 동적 설정: 슬라이드 폭, 보이는 개수, 중앙 오프셋
  const [config, setConfig] = useState({
    slideWidth: 615,
    visible: 3,
    gap: GAP,
    centerOffset: ((615 * 3 + GAP * 2) - 615) / 2
  });

  // 화면 크기 변경 시 config 업데이트
  useEffect(() => {
    const updateConfig = () => {
      const isMobile = window.innerWidth < 768;
      const visible = isMobile ? 1 : 3;
      const parentWidth = wrapRef.current.parentElement.clientWidth;
      const slideWidth = isMobile ? parentWidth : 615;
      const containerWidth = visible * slideWidth + (visible - 1) * GAP;
      const centerOffset = (containerWidth - slideWidth) / 2;
      setConfig({ slideWidth, visible, gap: GAP, centerOffset });
    };
    updateConfig();
    window.addEventListener('resize', updateConfig);
    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  // transform 적용
  useEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    w.style.transition = transOn
      ? `transform ${DURATION}ms ease`
      : 'none';
    const x = (config.slideWidth + config.gap) * idx - config.centerOffset;
    w.style.transform = `translateX(-${x}px)`;
  }, [idx, transOn, config]);

  // 자동 재생
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIdx(i => i + 1);
      setTransOn(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // 무한루프 보정
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

  // 이전/다음
  const next = () => { setIdx(i => i + 1); setTransOn(true); };
  const prev = () => { setIdx(i => i - 1); setTransOn(true); };

  // 카드 클릭 핸들러 (예시)
  const handleClick = (i) => {
    const cardNum = i % total;
    if (cardNum === 0) {
      window.open('https://www.youtube.com/@%EB%B0%A9%ED%99%94%EC%B9%A8%EB%A1%80%EA%B5%90%ED%9A%8C','_blank');
    } else if (cardNum === 2) {
      navigate('/location');
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
