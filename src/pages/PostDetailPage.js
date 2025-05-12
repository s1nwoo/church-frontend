// src/pages/PostDetailPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './PostDetailPage.css';

const TABS = [
  { key: '공지사항', label: '공지사항' },
  { key: '성도소식', label: '성도소식' },
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
    <div className="post-detail-container page-container">
      <h1 className="page-title">소식 나눔</h1>

      {/* 카테고리 탭 */}
      <nav className="location-submenu">
        <ul>
          {TABS.map(tab => (
            <li key={tab.key}>
              <button
                className={activeTab === tab.key ? 'active' : undefined}
                onClick={() => goToTab(tab.key)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 상세 콘텐츠 */}
      <h2 className="post-title">{post.title}</h2>
      <p className="post-meta">
        {new Date(post.createdDate)
           .toLocaleDateString('ko-KR', {
             year: 'numeric', month: '2-digit', day: '2-digit'
           })}
        &nbsp;|&nbsp;{post.writer}
      </p>
      <div className="post-content">
        {post.content?.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      <button
        className="btn-list"
        onClick={() => navigate(`/posts?category=${activeTab}`)}
      >
        목록으로 돌아가기
      </button>
    </div>
  );
}
