// src/pages/PostsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import bannerImg7 from '../components/images/top_banner_img7.png'; /* 소식나눔 배너 우측 일러스트 */
import './PostsPage.css';
import './ChurchIntroPage.css';

const TABS = [
  { key: '공지사항', label: '공지사항' },
];

export default function PostsPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // URL 쿼리(category)에서 초기 탭 결정
  const queryCat = new URLSearchParams(location.search).get('category');
  const [activeTab, setActiveTab]         = useState(queryCat || '공지사항');
  const [keyword, setKeyword]             = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage]                   = useState(0);
  const [data, setData]                   = useState({ content: [], totalPages: 0 });
  const size = 10;

  // API 호출
  const fetchPosts = () => {
    axios.get('/api/posts', {
      params: { category: activeTab, keyword: searchKeyword, page, size }
    })
    .then(res => {
      const d = res.data;
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

  // location.search 변경 시 (외부에서 category 바뀔 때) 반영
  useEffect(() => {
    const cat = new URLSearchParams(location.search).get('category');
    if (cat && cat !== activeTab) {
      setActiveTab(cat);
      setPage(0);
    }
  }, [location.search]);

  // 탭/페이지/검색어 변경 시 재조회
  useEffect(fetchPosts, [activeTab, page, searchKeyword]);

  const onSearch = () => {
    setPage(0);
    setSearchKeyword(keyword);
    // URL에도 반영
    navigate(`/posts?category=${activeTab}`, { replace: true });
  };

  const changeTab = (tabKey) => {
    setActiveTab(tabKey);
    setPage(0);
    // URL에도 반영
    navigate(`/posts?category=${tabKey}`, { replace: true });
  };

  return (
    <>
      {/* ─── 상단 배너 박스 (배경색 + 우측 일러스트) ─── */}
      <div className="intro-banner">
        <div className="intro-banner-inner banner-posts">
          <img src={bannerImg7} alt="" className="banner-deco-img" fetchpriority="high" loading="eager" />
          <div className="banner-text-overlay">
            <h1 className="banner-overlay-title">공지사항</h1>
            <p className="banner-overlay-subtitle">
              방화침례교회 공지사항을 확인하세요<br />
              하나님의 계획하심을 따르는 우리
            </p>
          </div>
        </div>
      </div>

      {/* ─── 탭 메뉴 ─── */}
      <nav className="intro-tabs">
        <div className="intro-tabs-inner">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'tab-item active' : 'tab-item'}
              onClick={() => changeTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="intro-container page-container">
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

        {/* 리스트 or 빈 안내 */}
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
                    {new Date(post.createdDate)
                       .toLocaleDateString('ko-KR')}
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
    </>
  );
}