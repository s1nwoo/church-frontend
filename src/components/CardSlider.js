import React, { useState } from 'react';
import './CardSlider.css';

// 카드 이미지 import
import card1 from './images/card/card5.png';
import card2 from './images/card/card2.png';
import card3 from './images/card/card4.png';

const cards = [card1, card2, card3];
const VISIBLE_COUNT = 3;

const CardSlider = () => {
  const [current, setCurrent] = useState(0);
  const len = cards.length;

  const prevSlide = () => setCurrent(c => (c - 1 + len) % len);
  const nextSlide = () => setCurrent(c => (c + 1) % len);
  const goTo = idx => setCurrent(idx);

  // 현재 인덱스부터 3개 순환 추출
  const visibleCards = Array.from({ length: VISIBLE_COUNT }, (_, i) =>
    cards[(current + i) % len]
  );

  return (
    <div className="card-slider">
      {/* slides-container: 버튼과 슬라이드를 감싸는 영역 */}
      <div className="slides-container">
        <button className="arrow arrow-left" onClick={prevSlide} aria-label="이전">
          ‹
        </button>
        <div className="slides-wrapper">
          {visibleCards.map((src, idx) => (
            <div key={idx} className="slide">
              <img src={src} alt={`card-${idx + 1}`} />
            </div>
          ))}
        </div>
        <button className="arrow arrow-right" onClick={nextSlide} aria-label="다음">
          ›
        </button>
      </div>

      {/* 도트 내비게이션 */}
      <div className="dots">
        {cards.map((_, idx) => (
          <span
            key={idx}
            className={`dot ${idx === current ? 'active' : ''}`}
            onClick={() => goTo(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default CardSlider;
