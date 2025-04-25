// src/components/Header.js

import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';
import logoImg from './images/logo.jpg';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  {
    label: '교회소개',
    subMenu: [
      { title: '교회안내',       links: ['공동체고백','교회비전·심벌','역사','사역계승'] },
      { title: '섬기는 사람들',   links: ['담임목사','교역자','장로','권사','집사','직원'] },
      { title: '교회정보',       links: ['예배시간','약도·주차','교회시설','교회전화번호','온라인헌금'] },
    ],
  },
  {
    label: '설교·찬양',
    subMenu: [
      { title: '설교', links: ['전체 설교','주일 설교','찬양 모음'] },
      { title: '찬양', links: ['찬양대','워십 팀'] },
      { title: '미디어', links: ['영상 갤러리'] },
    ],
  },
  {
    label: '목양·사역',
    subMenu: [
      { title: '목양',     links: ['목회 비전','양육 과정'] },
      { title: '사역',     links: ['봉사 안내','선교 소식'] },
      { title: '커뮤니티', links: ['게시판','소그룹'] },
    ],
  },
  {
    label: '교육·훈련',
    subMenu: [
      { title: '교육', links: ['주중 학교','주말 학교'] },
      { title: '훈련', links: ['리더훈련','새가족훈련'] },
      { title: '자료실', links: ['강의 자료','교재'] },
    ],
  },
];

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [openNav, setOpenNav]   = useState(null);
  const [userMenu, setUserMenu] = useState(false);
  const navRef  = useRef();
  const userRef = useRef();

  // 외부 클릭 감지하여 nav / user 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = e => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenNav(null);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNav    = label => setOpenNav(prev => (prev === label ? null : label));
  const handleLogout = () => { logout(); navigate('/'); };
  const currentItem  = navItems.find(item => item.label === openNav);

  return (
    <header className="header">
      <div className="header-inner page-container">
        {/* 로고 */}
        <div className="logo">
          <Link to="/"><img src={logoImg} alt="방화침례교회 로고" /></Link>
        </div>

        {/* 네비게이션 래퍼: 여기를 벗어나면 메가메뉴 자동 닫힘 */}
        <nav
          className="nav-wrapper"
          ref={navRef}
          onMouseLeave={() => setOpenNav(null)}
        >
          <ul className="nav">
            {navItems.map(item => (
              <li key={item.label} className="nav-item">
                <span
                  className="nav-label"
                  onClick={() => toggleNav(item.label)}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          {/* 메가메뉴: 화면 중앙 고정 */}
          <AnimatePresence>
            {currentItem && (
              <motion.div
                className="mega-menu"
                style={{ transform: 'translateX(-50%)' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mega-grid">
                  {currentItem.subMenu.map(sec => (
                    <div className="mega-section" key={sec.title}>
                      <h4>{sec.title}</h4>
                      <ul>
                        {sec.links.map(link => (
                          <li key={link}>
                            <Link to="#">{link}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* 로그인 / 유저 정보 + 로그아웃 */}
        <div className="header-login-btn">
          {!user ? (
            <Link to="/login"><button>로그인</button></Link>
          ) : (
            <div className="user-info" ref={userRef}>
              <span
                className="user-dropdown-toggle"
                onClick={() => setUserMenu(prev => !prev)}
              >
                {user.username}님
              </span>
              <AnimatePresence>
                {userMenu && (
                  <motion.div
                    className="user-dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button onClick={() => navigate('/profile')}>내 정보 수정</button>
                    {user.role === 'ROLE_ADMIN' && (
                      <button onClick={() => navigate('/admin')}>관리자 메뉴</button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <button onClick={handleLogout} className="logout-btn">
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
