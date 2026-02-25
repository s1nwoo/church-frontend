import React from 'react';
import './MainIntroSection.css';
import CardSlider from './CardSlider';

// hero 일러스트 import
import heroImage from './images/hero-illustration7.png';       // 데스크톱용 (가로형)
import heroImageMobile from './images/hero-illustration8.png'; // 모바일용 (세로형)

const MainIntroSection = () => (
  <section className="intro-section">
    <div className="intro-inner">
      {/* 히어로(위 50%) */}
      <div className="hero">
        {/* picture 태그: 768px 이하면 모바일용 세로 이미지, 그 외엔 데스크톱용 가로 이미지 */}
        <picture>
          <source media="(max-width: 768px)" srcSet={heroImageMobile} />
          <img src={heroImage} alt="사역 일러스트" className="hero-full-image" />
        </picture>
      </div>

      {/* 카드 슬라이더(아래 50%) */}
      <CardSlider />
    </div>
  </section>
);

export default MainIntroSection;