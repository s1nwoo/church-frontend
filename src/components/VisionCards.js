// src/components/VisionCards.js
// 교회소개 > "다섯 가지 소망" 카드 섹션
// 기존에는 PC용 intro.png 1장 + 모바일용 intro_app1~5.png 5장을 이미지로 붙였으나,
// 문구 수정·반응형·선명도를 위해 HTML/CSS/SVG로 구성한다.
import React, { useEffect, useRef } from 'react';
import './VisionCards.css';

/* ── 카드별 일러스트 (흰 배경 일러스트, 카드 하단에 배치) ─────────────── */
import worshipImg from './images/vision/worship.webp';
import bibleImg from './images/vision/bible.webp';
import prayImg from './images/vision/pray.webp';
import evangelismImg from './images/vision/evangelism.webp';
import fullnessImg from './images/vision/fullness.webp';

/* ── 카드 데이터 (문구는 기존 intro.png 원문 그대로) ─────────────────── */
const VISIONS = [
  {
    en: 'WORSHIP', ko: '예배',
    verse: '"모이기를 폐하는 어떤 사람들의 습관과 같이 하지 말고"', ref: '히브리서 10:25',
    body: '라는 말씀대로 예배를 신앙의 중심에 두고 모든 성도가 예배의 자리를 사모하며, 모이기에 힘쓰는 가운데 하나님께 영광 올려드리는 삶을 살아내는 공동체가 되기를 소망합니다.',
    img: worshipImg,
  },
  {
    en: 'BIBLE', ko: '성경',
    verse: '"이 율법책을 네 입에서 떠나지 말게 하며 주야로 그것을 묵상하여"', ref: '여호수아 1:8',
    body: '라는 말씀을 따라, 모든 성도가 날마다 말씀을 읽고 묵상하며, 그 말씀을 삶으로 순종하는 제자가 되어 말씀이 삶을 이끄는 공동체가 되기를 소망합니다.',
    img: bibleImg,
  },
  {
    en: 'PRAY', ko: '기도',
    verse: '"너는 내게 부르짖으라 내가 네게 응답하겠고 네가 알지 못하는 크고 은밀한 일을 네게 보이리라"', ref: '예레미야 33:3',
    body: '의 말씀을 마음에 품고 모든 성도가 매일 정한 시간을 구별하여 간절히 기도함으로 하나님의 뜻을 분별하고 능력을 덧입는 공동체가 되기를 소망합니다.',
    img: prayImg,
  },
  {
    en: 'EVANGELISM', ko: '전도',
    verse: '"너희는 온 천하에 다니며 만민에게 복음을 전파하라"', ref: '마가복음 16:15',
    body: '고 말씀하신 주님의 명령에 순종하여 모든 성도가 영혼을 사랑하는 주님의 마음을 가지고 친절한 행동과 준비된 말로 복음의 증인이 되는 공동체가 되기를 소망합니다.',
    img: evangelismImg,
  },
  {
    en: 'FULLNESS', ko: '충만',
    verse: '"오직 성령으로 충만함을 받으라"', ref: '에베소서 5:18',
    body: '하신 말씀을 사모하여 모든 성도가 성령으로 충만한 가운데 말씀충만, 기도충만, 지혜충만, 능력충만을 받아 은사대로 교회와 세상을 섬기는 초대교회의 모습이 나타나는 공동체가 되기를 소망합니다.',
    img: fullnessImg,
  },
];

export default function VisionCards() {
  const gridRef = useRef(null);

  // 스크롤 시 카드가 차례로 떠오르는 효과 (모션 최소화 설정이면 즉시 표시)
  useEffect(() => {
    const grid = gridRef.current;
    const cards = grid?.querySelectorAll('.vision-card') ?? [];
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!grid || reduce || !('IntersectionObserver' in window)) return undefined;

    // 여기까지 왔을 때만 숨김 상태로 전환 (CSS: .reveal-ready)
    grid.classList.add('reveal-ready');
    const revealAll = () => cards.forEach(c => c.classList.add('is-visible'));
    // 안전장치: 감지가 동작하지 않는 환경이어도 3초 뒤 모두 표시
    const fallback = setTimeout(revealAll, 3000);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    cards.forEach(c => io.observe(c));
    return () => { io.disconnect(); clearTimeout(fallback); };
  }, []);

  return (
    <section className="vision-section" aria-label="방화침례교회 다섯 가지 소망">
      <div className="vision-grid" ref={gridRef}>
        {VISIONS.map(({ en, ko, verse, ref, body, img }, i) => (
          <article className="vision-card" key={en} style={{ '--delay': `${i * 90}ms` }}>
            <div className="vision-card-text">
              <h3 className="vision-en"><span>{en}</span></h3>
              <p className="vision-ko">방화침례교회는 <strong>{ko}</strong>의 교회입니다.</p>
              <p className="vision-verse">{verse} <span className="vision-ref">({ref})</span></p>
              <p className="vision-body">{body}</p>
            </div>
            <div className="vision-card-illust">
              <img src={img} alt="" loading="lazy" decoding="async" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
