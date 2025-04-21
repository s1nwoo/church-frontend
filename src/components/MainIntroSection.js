// src/components/MainIntroSection.js
import React from 'react';
import './MainIntroSection.css';

const MainIntroSection = () => {
  return (
    <section className="main-intro">
        <div className="hero">
          {/* 이미지 교체 */}
          <img src="/images/main.jpg" alt="인트로 이미지" className="hero-bg-img" />
          <div className="overlay"></div>
            <div className="hero-text">
              <p className="subtitle">2025년 사역표어</p>
              <h1>“성령충만을 받으라!"</h1>
              <p className="verse">또 새 영을 너희 속에 두고 새 마음을 너희에게 주되 <br />
              너희 육신에서 굳은 마음을 제거하고 부드러운 마음을 줄 것 이며,<br />
              에스겔 36:26
              </p>

        </div>

        <div className="hero-info-section">
          {[
            ['SaRang ON'],
            ['SaGA', '사랑글로벌아카데미'],
            ['글로벌', '특별새벽부흥회'],
            ['2025 WEA', '서울총회'],
            ['제4회', '한국교회섬김의날']
          ].map(([line1, line2], idx) => (
            <div className="info-box" key={idx}>
              <strong>{line1}</strong>
              {line2 && <div>{line2}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MainIntroSection;