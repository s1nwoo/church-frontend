import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="page-container">
        <div className="footer-top">
          <span>©Banghwa Baptist Church. All Rights Reserved.</span>
          <div className="footer-links">
            <a href="#약관">이용약관</a>
            <a href="#개인정보">개인정보처리방침</a>
            <a href="#안내">이용안내</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
