// src/components/TopBar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './TopBar.css';
// (유튜브 아이콘은 원하는 SVG나 폰트어썸 아이콘으로 교체하세요)
const TopBar = () => (
  <div className="top-bar">
    <div className="top-bar-inner">
      <a
        href="https://www.youtube.com/your-channel"
        target="_blank"
        rel="noopener noreferrer"
        className="youtube-link"
      >
        {/* SVG 아이콘 예시 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="youtube-icon"
        >
          <path d="M23.5 6.2s-.2-1.7-.8-2.4c-.8-.9-1.7-.9-2.1-1C16.7 2.5 12 2.5 12 2.5h0s-4.7 0-8.6.3c-.4 0-1.3.1-2.1 1C.7 4.5.5 6.2.5 6.2S.3 8 .3 9.7v1c0 1.7.2 3.5.2 3.5s.2 1.7.8 2.4c.8.9 1.9.8 2.4.9 1.7.1 7.1.3 7.1.3s4.7 0 8.6-.3c.4 0 1.3-.1 2.1-1 .6-.7.8-2.4.8-2.4s.2-1.8.2-3.5v-1c0-1.7-.2-3.5-.2-3.5z" />
          <path fill="#fff" d="M9.6 14.5l5.6-2.8-5.6-2.8v5.6z" />
        </svg>
      </a>
      <div className="auth-links">
        <Link to="/login">LOGIN</Link>
        <span>/</span>
        <Link to="/signup">JOIN</Link>
      </div>
    </div>
  </div>
);

export default TopBar;
