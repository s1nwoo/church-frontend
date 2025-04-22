// src/components/InfoCardSection.js
import React from 'react';
import './InfoCardSection.css';
import { useNavigate } from 'react-router-dom';

const cards = [
  { icon: '🖋️', label: '새가족 등록' },
  { icon: '🅿️', label: '약도 · 주차' },
  { icon: '📄', label: '주보' },
  { icon: '⏰', label: '예배시간' }
];

const InfoCardSection = () => {
  const navigate = useNavigate();

  const handleClick = (label) => {
    if (label === '약도 · 주차') {
      navigate('/location');
    }
  };

  return (
    <section className="info-card-section">
      <div className="info-card-container">
        {cards.map((card, idx) => (
          <div
            className="info-card"
            key={idx}
            onClick={() => handleClick(card.label)}
            style={{ cursor: 'pointer' }}
          >
            <div className="info-icon">{card.icon}</div>
            <p className="info-label">{card.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default InfoCardSection;
