// src/components/MainIntroSection.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainIntroSection.css';

const MainIntroSection = () => {
  const navigate = useNavigate();

  const items = [
    ['내용1'],
    ['내용2'],
    ['내용3'],
    ['내용4'],
    ['성경타자통독'],
  ];

  const handleClick = (label) => {
    if (label === '성경타자통독') {
      navigate('/bible-practice'); // ✅ 해당 경로로 이동
    }
  };
  return (
    <section className="main-intro">
      <div className="hero">
        {/*
          <div className="overlay"></div>
          <div className="hero-text">
            <p className="subtitle">2025년 사역표어</p>
            <h1>“성령충만을 받으라!"</h1>
            <p className="verse">
              또 새 영을 너희 속에 두고 새 마음을 너희에게 주되 <br />
              너희 육신에서 굳은 마음을 제거하고 부드러운 마음을 줄 것 이며,<br />
              에스겔 36:26
            </p>
          </div>
        */}

          <div className="hero-info-section">
            {items.map(([line1, line2], idx) => (
              <div
                className="info-box"
                key={idx}
                onClick={() => handleClick(line1)} // ✅ 클릭 이벤트 등록
                style={{ cursor: line1 === '성경타자통독' ? 'pointer' : 'default' }}
              >
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
