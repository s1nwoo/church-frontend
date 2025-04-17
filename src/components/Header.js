import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Header({ isLoggedIn, userName, setIsLoggedIn }) {
  const navigate = useNavigate();
//  const userRole = localStorage.getItem('userRole');

  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    localStorage.clear();
    setIsLoggedIn(false);
    navigate('/');
    alert('로그아웃 되었습니다.');
  };

  return (
    <header>
      <nav>
        <Link to="/">🏠 홈</Link> |{" "}
        {isLoggedIn ? (
          <>
            <span style={{ marginRight: '1rem' }}>👋 {userName}님</span>
            <button onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login">로그인</Link> | <Link to="/signup">회원가입</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;