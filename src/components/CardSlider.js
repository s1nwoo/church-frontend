import React, { useState } from 'react';
import './CardSlider.css';

// 실제 파일명 그대로 import
import card5 from './images/card/card8.png';
import card6 from './images/card/card1.png';
import card7 from './images/card/card2.png';

const cards = [card5, card6, card7];
const VISIBLE_COUNT = 3;

const CardSlider = () => {
  const [current, setCurrent] = useState(0);
  const len = cards.length;

  const prev = () => setCurrent(c => (c - 1 + len) % len);
  const next = () => setCurrent(c => (c + 1) % len);
  const goTo = idx => setCurrent(idx);

  const visible = Array.from(
    { length: VISIBLE_COUNT },
    (_, i) => cards[(current + i) % len]
  );

  return (
    <div className="card-slider">
      <div className="slides-container">
        <button className="arrow arrow-left" onClick={prev} aria-label="이전">‹</button>
        <div className="slides-wrapper">
          {visible.map((src, i) => (
            <div key={i} className="slide">
              <img src={src} alt={`card-${i+1}`} />
            </div>
          ))}
        </div>
        <button className="arrow arrow-right" onClick={next} aria-label="다음">›</button>
      </div>
      <div className="dots">
        {cards.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default CardSlider;
