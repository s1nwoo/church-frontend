// src/pages/LogoGalleryPage.js
import React from 'react';
import './LogoGalleryPage.css';

const LogoGalleryPage = () => {
  const logos = [
    'swlogo1.png',
    'yelogo.png',
    'kjlogo.png',
    'jblogo.png',
    'swlogo2.png',
    'swlogo3.png',
    'swlogo4.png',
    'swlogo5.png',
  ]; // 실제로는 이미지 파일 경로 배열

  return (
    <div className="logo-gallery page-container">
      <h2 className="main-title">로고 모음집</h2>
      <div className="logo-grid">
        {logos.map((logo, idx) => (
          <div className="logo-item" key={idx}>
            <img src={require(`../components/images/${logo}`)} alt={`로고 ${idx + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoGalleryPage;
