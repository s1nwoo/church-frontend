// src/pages/PostsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PostsPage.css';

const TABS = [
  { key: '공지사항', label: '공지사항' },
  { key: '성도소식', label: '성도소식' },
];

export default function PostsPage() {
  const navigate = useNavigate();

  // 카테고리 탭, 입력 키워드, 실제 검색 키워드, 페이지 인덱스
  const [activeTab, setActiveTab]         = useState('공지사항');
  const [keyword, setKeyword]             = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage]                   = useState(0);

  // API 응답 구조를 담을 state: 항상 content 배열과 totalPages 숫자가 있어야 함
  const [data, setData] = useState({ content: [], totalPages: 0 });

  const size = 10;

  // 실제 API 호출 함수
  const fetchPosts = () => {
    axios
      .get('/api/posts', {
        params: {
          category: activeTab,
          keyword:  searchKeyword,
          page,
          size
        }
      })
      .then(res => {
        const d = res.data;
        // res.data가 배열일 수도, Page 객체일 수도 있으므로 분기 처리
        if (Array.isArray(d)) {
          setData({ content: d, totalPages: 1 });
        } else {
          setData({
            content:    d.content    || [],
            totalPages: d.totalPages || 0
          });
        }
      })
      .catch(console.error);
  };

  // 탭, 페이지, 실제 검색 키워드가 바뀔 때마다 재조회
  useEffect(fetchPosts, [activeTab, page, searchKeyword]);

  // 검색 버튼 클릭 시
  const onSearch = () => {
    setPage(0);
    setSearchKeyword(keyword);
  };

  return (
    <div className="posts-container page-container">
      <h1 className="page-title">소식 나눔</h1>

      {/* 카테고리 탭 */}
      <nav className="location-submenu">
        <ul>
          {TABS.map(tab => (
            <li key={tab.key}>
              <button
                className={activeTab === tab.key ? 'active' : undefined}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(0);
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 검색 바 */}
      <div className="posts-search">
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <button onClick={onSearch}>검색</button>
      </div>

      {/* 리스트 또는 빈 상태 안내 */}
      {data.content.length === 0 ? (
        <p className="no-data">등록된 글이 없습니다.</p>
      ) : (
        <ul className="posts-list">
          {data.content.map(post => (
            <li key={post.id} onClick={() => navigate(`/posts/${post.id}`)}>
              <div className="left">
                <p className="title">{post.title}</p>
              </div>
              <div className="right">
                <p className="meta">
                  {new Date(post.createdDate).toLocaleDateString('ko-KR')}
                  &nbsp;|&nbsp;{post.writer}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 페이지네이션 */}
      <div className="pagination">
        <button
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(p - 1, 0))}
        >
          &lt; 이전
        </button>
        <span>
          {page + 1} / {data.totalPages}
        </span>
        <button
          disabled={page + 1 >= data.totalPages}
          onClick={() => setPage(p => Math.min(p + 1, data.totalPages - 1))}
        >
          다음 &gt;
        </button>
      </div>
    </div>
  );
}
