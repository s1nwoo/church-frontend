// src/pages/admin/AdminDashboardPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboardPage.css';
import { FaUsers, FaChalkboardTeacher, FaNewspaper, FaImages } from 'react-icons/fa';

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: '성도 관리',
      description: '교인 정보 등록/수정/삭제 기능을 제공합니다.',
      icon: <FaUsers size={32} />,
      path: '/admin/members',
    },
    {
      title: '설교 관리',
      description: '설교 내용을 등록하고 관리할 수 있습니다.',
      icon: <FaChalkboardTeacher size={32} />,
      path: '/admin/sermons',
    },
    {
      title: '소식 관리',
      description: '공지사항과 성도소식을 등록하고 관리할 수 있습니다.',
      icon: <FaNewspaper size={32} />,
      path: '/admin/posts',
    },
    {
      title: '카드 슬라이더 관리',
      description: '메인 페이지 카드 슬라이더 이미지와 링크를 관리합니다.',
      icon: <FaImages size={32} />,
      path: '/admin/card-slider',
    },
  ];

  return (
    <div className="admin-dashboard-container page-container">
      <h2 className="admin-title">관리자 메뉴</h2>
      <div className="admin-card-grid">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="admin-card"
            onClick={() => navigate(card.path)}
          >
            <div className="card-title">{card.title}</div>
            <div className="card-icon">{card.icon}</div>
            <div className="card-description">{card.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardPage;