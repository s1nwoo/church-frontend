// src/components/InfoCardSection.js
import React from 'react';
import './InfoCardSection.css';
import { useNavigate } from 'react-router-dom';

import iconFamily from './icons/icon_family.png';
import iconLocation from './icons/icon_location.png';
import iconDocument from './icons/icon_document.png';
import iconClock from './icons/icon_clock.png';

const cards = [
  { icon: iconFamily, label: '새가족 등록' },
  { icon: iconLocation, label: '오시는 길' },
  { icon: iconDocument, label: '주보' },
  { icon: iconClock, label: '예배시간' }
];

const InfoCardSection = () => {
  const navigate = useNavigate();

  const handleClick = (label) => {
    if (label === '오시는 길') {
      navigate('/location');
    }
  };

  return (
    <section className="info-card-section">
      <div className="page-container">
        <div className="info-card-container">
          {cards.map((card, idx) => (
            <div
              className="info-card"
              key={idx}
              onClick={() => handleClick(card.label)}
              style={{ cursor: 'pointer' }}
            >
              <div className="info-icon">
                <img src={card.icon} alt={card.label} />
              </div>
              <p className="info-label">{card.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InfoCardSection;
