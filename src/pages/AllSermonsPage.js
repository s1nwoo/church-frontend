// src/pages/AllSermonsPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AllSermonsPage.css';

const TABS = [
  { key: 'sunday',    label: '주일예배'    },
];

export default function AllSermonsPage() {
  const [activeTab, setActiveTab] = useState('sunday');
  const [list, setList]           = useState([]);
  const navigate = useNavigate();

  // 탭 변경 또는 마운트 시 전체 목록 불러오기
  useEffect(() => {
    axios.get('/api/sermons', {
      params: {
        page: 0,
        size: 1000,
        includeDeleted: false,
        keyword: ''
      }
    })
    .then(res => {
      // TODO: activeTab별 필터링 로직 넣을 수도 있음
      const items = res.data.content
        .slice()
        .sort((a, b) => b.id - a.id);
      setList(items);
    })
    .catch(console.error);
  }, [activeTab]);

  return (
    <div className="sermon-list-container page-container">
      {/* 페이지 타이틀 + 서브메뉴 */}
      <h1 className="page-title">예배와 훈련</h1>
      <nav className="location-submenu">
        <ul>
          {TABS.map(tab => (
            <li key={tab.key}>
              <button
                className={activeTab === tab.key ? 'active' : undefined}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.icon && <span className="video-icon">▶️</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 전체 설교 리스트 */}
      <ul className="sermon-list">
        {list.map(item => (
          <li
            key={item.id}
            onClick={() => navigate(`/worship-media/${item.id}`)}
          >
            <div className="left">
              <p className="title">
                {item.title}
                {item.bibleText && (
                  <span className="ref">({item.bibleText})</span>
                )}
              </p>
            </div>
            <div className="right">
              <p className="meta">
                {new Date(item.sermonDate).toLocaleDateString('ko-KR', {
                  year:   'numeric',
                  month:  '2-digit',
                  day:    '2-digit'
                })}
                &nbsp;|&nbsp;{item.preacher}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
