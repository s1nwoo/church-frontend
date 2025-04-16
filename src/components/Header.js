import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // ✅ 로그인 상태 확인 (간단하게 localStorage 사용 예시)
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(loggedIn === "true");
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem("isLoggedIn"); // ✅ 로그아웃 시 제거
      setIsLoggedIn(false);
      alert('로그아웃 되었습니다.');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('로그아웃 실패');
    }
  };

  return (
    <header style={{ padding: '1rem', background: '#eee' }}>
      <nav>
        <Link to="/">🏠 홈</Link> |{' '}
        {isLoggedIn ? (
          <button onClick={handleLogout}>🚪 로그아웃</button>
        ) : (
          <Link to="/login">🔐 로그인</Link>
        )}
      </nav>
    </header>
  );
}

export default Header;
