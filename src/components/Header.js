// src/components/Header.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <Link to="/">
            <img src="/images/logo.jpg" alt="방화침례교회 로고" />
          </Link>
        </div>

        <nav className="nav">
          <ul>
            <li>교회소개</li>
            <li>설교 · 찬양</li>
            <li>목양 · 사역</li>
            <li>교육 · 훈련</li>
          </ul>
        </nav>

        <div className="login-btn">
          {!user ? (
            <Link to="/login">
              <button>로그인</button>
            </Link>
          ) : (
            <div className="user-info">
              <span>{user.name}님</span>
              <button onClick={logout} className="logout-btn">로그아웃</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
