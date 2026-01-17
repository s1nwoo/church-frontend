// src/pages/PostDetailPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import topBanner7 from '../components/images/top_banner7.png';
import './PostDetailPage.css';
import './ChurchIntroPage.css';

const TABS = [
  { key: '공지사항', label: '공지사항' },
];

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost]           = useState(null);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    axios.get(`/api/posts/${id}`)
      .then(res => {
        setPost(res.data);
        setActiveTab(res.data.category);
      })
      .catch(console.error);
  }, [id]);

  if (!post) {
    return <div className="page-container">로딩 중…</div>;
  }

  const goToTab = (tabKey) => {
    navigate(`/posts?category=${tabKey}`);
  };

  return (
    <>
      {/* ─── 상단 배너 박스 (이미지 + 텍스트) ─── */}
      <div className="intro-banner">
        <div className="intro-banner-inner">
          <img src={topBanner7} alt="공지사항 배너" className="banner-image" />
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
              onClick={() => goToTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── 콘텐츠 영역 (흰색 박스) ─── */}
      <div className="intro-container page-container">
        <div className="post-detail-content">
          {/* 제목 */}
          <h2 className="post-title">{post.title}</h2>

          {/* 날짜 | 작성자 */}
          <p className="post-meta">
            {new Date(post.createdDate)
               .toLocaleDateString('ko-KR', {
                 year: 'numeric', month: '2-digit', day: '2-digit'
               })}
            &nbsp;|&nbsp;{post.writer}
          </p>

          {/* 본문 */}
          <div className="post-content">
            {post.content?.split('\n').map((line, i) => (
              <p key={i}>{line || <br />}</p>
            ))}
          </div>

          {/* 목록으로 버튼 */}
          <button
            className="btn-list"
            onClick={() => navigate(`/posts?category=${activeTab}`)}
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </>
  );
}