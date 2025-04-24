// src/components/Header.js
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';
import logoImg from './images/logo.jpg';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        <div className="header-login-btn">
          {!user ? (
            <Link to="/login">
              <button>로그인</button>
            </Link>
          ) : (
            <div className="user-info" ref={dropdownRef}>
              <span onClick={toggleDropdown} className="user-dropdown-toggle">
                {user.username}님
              </span>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      className="user-dropdown-menu"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button onClick={() => navigate('/profile')}>내 정보 수정(기능 없음)</button>
                      {user.role === 'ROLE_ADMIN' && (
                        <button onClick={() => navigate('/admin')}>관리자 메뉴</button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              <button onClick={handleLogout} className="logout-btn">로그아웃</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
