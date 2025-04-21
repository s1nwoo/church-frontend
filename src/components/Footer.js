// src/components/Footer.js
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-left">
          <p>©2023 SaRang Church. All Rights reserved.</p>
          <div className="social-icons">
            <a href="#" aria-label="facebook">🔵</a>
            <a href="#" aria-label="instagram">📸</a>
            <a href="#" aria-label="youtube">▶️</a>
            <a href="#" aria-label="godpia">GODpia</a>
          </div>
        </div>

        <div className="footer-right">
          <div className="footer-links">
            <a href="#">이용약관</a>
            <a href="#">개인정보처리방침</a>
            <a href="#">이용안내</a>
          </div>
          <div className="footer-buttons">
            <button className="global-btn">Global Site</button>
            <button className="top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>⬆</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;