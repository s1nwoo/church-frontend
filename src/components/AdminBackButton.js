import React from 'react';
import { Link } from 'react-router-dom';
import './AdminBackButton.css';

export default function AdminBackButton() {
  return <Link to="/admin" className="admin-back-button" aria-label="이전: 관리자 목록으로">
    <span aria-hidden="true">←</span> 이전 <span className="admin-back-destination">관리자 목록</span>
  </Link>;
}
