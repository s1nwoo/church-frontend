import React, { useState, useRef, useEffect } from 'react';
import './CardSlider.css';

// 실제 사용하시는 카드 이미지들을 모두 import 하세요
import card1 from './images/card/card1.png';
import card2 from './images/card/card2.png';
import card3 from './images/card/card3.png';
// 예: 6개라면 아래도 import
 import card4 from './images/card/card9.png';
// import card5 from './images/card/card5.png';
// import card6 from './images/card/card6.png';

const ORIGINAL = [card1, card2, card3, card4 /*, card4, card5, card6 */];
const VISIBLE = 3;               // 한 번에 보일 카드 수
const WIDTH = 615;               // 카드너비 (px)
const GAP   = 30;                // 카드간격 (px)
const DURATION = 500;            // 애니메이션 시간 (ms)

// 컨테이너 폭: 3장*WIDTH + 2*GAP
const CONTAINER_WIDTH = VISIBLE * WIDTH + (VISIBLE - 1) * GAP;
// 가운데 오프셋: (컨테이너폭 - 카드너비)/2
const CENTER_OFFSET   = (CONTAINER_WIDTH - WIDTH) / 2;

const CardSlider = () => {
  // 앞뒤로 원본을 감싸서 무한루프
  const extended = [
    ...ORIGINAL,
    ...ORIGINAL,
    ...ORIGINAL
  ];
  const total = ORIGINAL.length;

  const [idx, setIdx] = useState(total);   // 시작은 중앙 원본 첫번째
  const [transOn, setTransOn] = useState(true);
  const wrapRef = useRef(null);

  // translate 계산 & transition
  useEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    w.style.transition = transOn
      ? `transform ${DURATION}ms ease`
      : 'none';
    // 이동 거리 = 카드+gap * idx, 보정값(center offset) 빼기
    const x = (WIDTH + GAP) * idx - CENTER_OFFSET;
    w.style.transform = `translateX(-${x}px)`;
  }, [idx, transOn]);

  // next / prev
  const next = () => { setIdx(i => i + 1); setTransOn(true); };
  const prev = () => { setIdx(i => i - 1); setTransOn(true); };

  // transition 끝나면 루프 보정
  const onEnd = () => {
    if (idx >= total * 2) {
      // 우측 복제 구간 → 실제 중앙 원본 첫위치
      setTransOn(false);
      setIdx(total);
    }
    if (idx < total) {
      // 좌측 복제 구간 → 실제 중앙 원본 마지막위치
      setTransOn(false);
      setIdx(total + (idx % total));
    }
  };

  return (
    <div className="card-slider">
      <button className="arrow arrow-left" onClick={prev} aria-label="이전">‹</button>
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
      <button className="arrow arrow-right" onClick={next} aria-label="다음">›</button>
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
