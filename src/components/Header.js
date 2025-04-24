// src/components/Header.js
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';
import logoImg from './images/logo.jpg';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // 로그아웃 후 홈으로 이동
  };

  return (
    <header className="header">
      <div className="header-inner page-container">
        <div className="logo">
          <Link to="/">
            <img src={logoImg} alt="방화침례교회 로고" />
          </Link>
        </div>

        <nav className="nav">
          <ul>
            <li>카테고리1</li>
            <li>카테고리2</li>
            <li>카테고리3</li>
            <li>카테고리4</li>
          </ul>
        </nav>

        <div className="login-btn">
          {!user ? (
            <Link to="/login">
              <button>로그인</button>
            </Link>
          ) : (
            <div className="user-info">
              <span>{user.username}님</span>
              <button onClick={handleLogout} className="logout-btn">로그아웃</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
