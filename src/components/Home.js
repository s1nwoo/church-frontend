// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>기능 선택</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/posts">📚 게시판 보기</Link></li>
        <li><Link to="/bible-practice">✍️ 성경 타자 연습</Link></li>
        <li><Link to="/location">📍 위치 보기</Link></li>
        <li><Link to="/signup">✍️ 회원가입</Link></li>
         <li><Link to="/sermons">🎥 설교 영상</Link></li>
        {/* 필요 시 기능 계속 추가 가능 */}
      </ul>
    </div>
  );
}

export default Home;
