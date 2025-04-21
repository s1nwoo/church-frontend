// src/components/Home.js
import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div
        className="hero"
        style={{
          backgroundImage: `url("/images/main.jpg")`
        }}
      >
        <div className="hero-overlay"></div>

        <div className="hero-text">
          <p className="subtitle">2025년 “새로운 길” 주일 설교 시리즈 (이사야서 강해)</p>
          <h1>“앙망하라,<br />새로운 길이 반드시 열리리라!”</h1>
          <p className="verse">Turn to God and a New Way Will Surely Open</p>
          <div className="hero-buttons">
            <button>생방송</button>
            <button>은혜게시판</button>
          </div>
        </div>

        <div className="hero-info-section">
          {[
            'SaRang ON',
            'SaGA 사랑글로벌아카데미',
            '글로벌 특별새벽부흥회',
            '2025 WEA 서울총회',
            '제4회 한국교회섬김의날'
          ].map((text, idx) => (
            <div className="info-box" key={idx}>{text}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;