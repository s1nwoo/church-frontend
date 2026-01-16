// src/pages/AllSermonsPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AllSermonsPage.css';

const TABS = [
  { key: 'sunday',  label: '주일예배' },
  { key: 'outdoor', label: '야외예배' },
];

export default function AllSermonsPage() {
  const [activeTab, setActiveTab] = useState('sunday');
  const [list, setList]           = useState([]);
  const navigate = useNavigate();

  // 탭 변경 또는 마운트 시 전체 목록 불러오기
  useEffect(() => {
    if (activeTab !== 'sunday') {
      // 야외예배일 땐 API 호출 안 함
      setList([]);
      return;
    }
    axios.get('/api/sermons', {
      params: {
        page: 0,
        size: 1000,
        includeDeleted: false,
        keyword: ''
      }
    })
    .then(res => {
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
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ─── 주일예배 목록 ─── */}
      {activeTab === 'sunday' && (
        <ul className="sermon-list">
          {list.map(item => (
            <li
              key={item.id}
              onClick={() => navigate(`/worship-media/${item.id}`)}
            >
              <div className="left">
                <p className="title">
                  {item.content}
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
      )}

      {/* ─── 야외예배 준비중 ─── */}
      {activeTab === 'outdoor' && (
        <div className="placeholder">
          <p>
            “{TABS.find(t => t.key === activeTab).label}” 콘텐츠는<br/>
            준비 중입니다.
          </p>
        </div>
      )}
    </div>
  );
}