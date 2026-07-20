// src/components/CardSlider.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CardSlider.css';

import allowL from './images/allow_l.png';
import allowR from './images/allow_r.png';
// 이미지 맵 유틸 (관리 페이지와 공유)
import { resolveImageSrc, handleImageError, handleImageLoad } from '../utils/cardImageMap';

// API 실패 시 폴백 (기존 카드 5장 그대로 유지)
const FALLBACK_CARDS = [
  { id: 1, imageUrl: 'images/card/card3.png', linkType: 'external', linkUrl: 'https://www.youtube.com/@%EB%B0%A9%ED%99%94%EC%B9%A8%EB%A1%80%EA%B5%90%ED%9A%8C', title: '유튜브 채널' },
  { id: 2, imageUrl: 'images/card/card2.png', linkType: 'internal', linkUrl: '/church-intro', title: '교회 소개' },
  { id: 3, imageUrl: 'images/card/card4.png', linkType: 'internal', linkUrl: '/location',     title: '오시는 길' },
  { id: 4, imageUrl: 'images/card/card1.png', linkType: 'none',     linkUrl: '',              title: '카드 4' },
  { id: 5, imageUrl: 'images/card/card5.png', linkType: 'internal', linkUrl: '/worship-info', title: '예배 안내' },
];

const VISIBLE = 3;
const WIDTH = 615;
const GAP = 30;
const DURATION = 500;
const CONTAINER_WIDTH = VISIBLE * WIDTH + (VISIBLE - 1) * GAP; // 1905
const CENTER_OFFSET = (CONTAINER_WIDTH - WIDTH) / 2;           // 645

const CardSlider = () => {
  const navigate = useNavigate();

  // API에서 받아온 카드 목록
  const [cards, setCards] = useState([]);

  // 슬라이더 상태
  const [idx, setIdx] = useState(0);
  const [transOn, setTransOn] = useState(true);
  const wrapRef = useRef(null);
  const touchStartX = useRef(null);
  // 애니메이션 진행 중 잠금: 트랜지션이 끝나기 전 중복 이동을 막아
  // 복제본 범위를 넘어서며 생기는 '뚝뚝 끊김/되돌아옴'을 방지
  const animatingRef = useRef(false);
  const idxRef = useRef(0); // 타이머 콜백에서 최신 idx 참조용

  /* ------------------------------------------------------------------
   * API 로딩: 활성 카드 목록 가져오기
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/banner-cards`);
        if (!res.ok) throw new Error('API 오류');
        const data = await res.json();
        // 데이터 없으면 폴백 사용
        setCards(data.length > 0 ? data : FALLBACK_CARDS);
      } catch (e) {
        console.warn('카드 슬라이더 API 로딩 실패, 기본 이미지 사용', e);
        setCards(FALLBACK_CARDS);
      }
    };
    fetchCards();
  }, []);

  // 카드가 로딩되면 인덱스 초기화
  const total = cards.length;
  const extended = total > 0 ? [...cards, ...cards, ...cards] : [];

  useEffect(() => {
    if (total > 0) setIdx(total);
  }, [total]);

  /* ------------------------------------------------------------------
   * 슬라이드 위치 계산
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const w = wrapRef.current;
    if (!w || total === 0) return;

    w.style.transition = transOn ? `transform ${DURATION}ms ease` : 'none';

    let x;
    if (window.innerWidth <= 768) {
      const container  = w.parentElement;
      const slideWidth = container.offsetWidth;
      const mobileGap  = 16;
      x = (slideWidth + mobileGap) * (idx - total);
    } else {
      x = (WIDTH + GAP) * idx - CENTER_OFFSET;
    }
    w.style.transform = `translateX(-${x}px)`;
  }, [idx, transOn, total]);

  /* ------------------------------------------------------------------
   * 한 칸 이동 + 무한 루프 보정 (모두 타이머 기반)
   * transitionend 이벤트가 모바일에서 불안정하게 누락되면 잠금 해제·루프 보정이
   * 안 되어 idx가 복제본 범위를 벗어나며 화면이 끊기거나 되돌아온다.
   * → 애니메이션 시간(DURATION) 뒤 타이머로 확실히 처리한다.
   * ------------------------------------------------------------------ */
  // 최신 idx를 타이머 콜백에서 참조하기 위한 ref (stale closure 방지)
  useEffect(() => { idxRef.current = idx; }, [idx]);

  const step = (dir) => {
    if (animatingRef.current) return;      // 애니메이션 중 중복 이동 무시(빠른 연타 방지)
    animatingRef.current = true;
    setTransOn(true);
    setIdx(i => i + dir);
    setTimeout(() => {
      animatingRef.current = false;        // 다음 이동 허용
      // 애니메이션 완료 후, 안전 범위[total, total*2)를 벗어났으면 순간이동으로 보정
      const cur = idxRef.current;
      if (cur >= total * 2)  { setTransOn(false); setIdx(cur - total); }
      else if (cur < total)  { setTransOn(false); setIdx(cur + total); }
    }, DURATION);
  };

  /* ------------------------------------------------------------------
   * 자동 재생
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (total === 0) return;
    const id = setInterval(() => { step(1); }, 5000); // 잠금 로직 공유(step)
    return () => clearInterval(id);
    // step은 ref/setter만 사용하므로 total만 의존해도 안전(매 렌더 인터벌 재생성 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const next = () => step(1);
  const prev = () => step(-1);

  /* ------------------------------------------------------------------
   * 터치 스와이프
   * ------------------------------------------------------------------ */
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
    touchStartX.current = null;
  };

  /* ------------------------------------------------------------------
   * 카드 클릭 처리
   * ------------------------------------------------------------------ */
  const handleClick = (card) => {
    if (!card.linkType || card.linkType === 'none' || !card.linkUrl) return;
    if (card.linkType === 'external') {
      window.open(card.linkUrl, '_blank');
    } else if (card.linkType === 'internal') {
      navigate(card.linkUrl);
    }
  };

  /* ------------------------------------------------------------------
   * 로딩 중 표시
   * ------------------------------------------------------------------ */
  if (total === 0) {
    return <div className="card-slider-loading">로딩 중...</div>;
  }

  /* ------------------------------------------------------------------
   * 렌더링
   * ------------------------------------------------------------------ */
  return (
    <div className="card-slider">
      <button className="arrow arrow-left" onClick={prev} aria-label="이전">
        <img src={allowL} alt="이전" />
      </button>

      <div
        className="slides-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={wrapRef}
          className="slides-wrapper"
        >
          {extended.map((card, i) => (
            <div
              key={i}
              className="slide"
              style={{ cursor: card.linkType !== 'none' ? 'pointer' : 'default' }}
              onClick={() => handleClick(card)}
            >
              <img
                src={resolveImageSrc(card.imageUrl)}
                alt={card.title || `card-${(i % total) + 1}`}
                onError={(e) => handleImageError(e, card.imageUrl)}
                onLoad={handleImageLoad}
              />
            </div>
          ))}
        </div>
      </div>

      <button className="arrow arrow-right" onClick={next} aria-label="다음">
        <img src={allowR} alt="다음" />
      </button>

      <div className="dots">
        {cards.map((_, i) => (
          <span
            key={i}
            className={`dot ${(idx - total + total * 10) % total === i ? 'active' : ''}`}
            onClick={() => { setIdx(total + i); setTransOn(true); }}
          />
        ))}
      </div>
    </div>
  );
};

export default CardSlider;