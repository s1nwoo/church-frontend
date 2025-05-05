import React from 'react';
import './MainIntroSection.css';
import CardSlider from './CardSlider';

// 이미지 import: hero-illustration.png가 아래 경로에 있어야 합니다.
import heroIllustration from './images/hero-illustration.png';

const MainIntroSection = () => (
  <section className="intro-section">
    <div className="intro-inner page-container">
      {/* ─── 위 50%: 이미지 전체 노출 ─── */}
      <div className="hero">
        <div className="hero-full-image">
          <img
            src={heroIllustration}
            alt="사역 일러스트"
          />
        </div>
      </div>

      {/* ─── 아래 50%: 카드 슬라이더 ─── */}
      <CardSlider />
    </div>
  </section>
);

export default MainIntroSection;
