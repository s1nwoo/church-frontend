import React from 'react';
import './MainIntroSection.css';
import CardSlider from './CardSlider';

// hero 일러스트 import
import heroImage from './images/hero-illustration.png';

const MainIntroSection = () => (
  <section className="intro-section">
    <div className="intro-inner">
      {/* 히어로(위 50%) */}
      <div className="hero">
        <img src={heroImage} alt="사역 일러스트" className="hero-full-image" />
      </div>

      {/* 카드 슬라이더(아래 50%) */}
      <CardSlider />
    </div>
  </section>
);

export default MainIntroSection;
