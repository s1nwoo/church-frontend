import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

console.log('response.data:', response.data);
console.log('typeof response.data:', typeof response.data);

    const user = response.data;
    localStorage.setItem('user', JSON.stringify(user));
    login(user); // Header에서 user.name 접근 가능

      alert('로그인 성공!');
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('로그인 실패: 아이디 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>로그인</h2>
        <p className="welcome">
          사랑의교회 홈페이지에 오신 것을 환영합니다.<br />
          가입하신 아이디와 비밀번호를 입력해주세요
        </p>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />

          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button type="submit" className="login-btn">로그인</button>

          <div className="sub-buttons">
            <button type="button">아이디 찾기</button>
            <button type="button">비밀번호 찾기</button>
          </div>

          <button
            type="button"
            className="register-btn"
            onClick={() => navigate('/signup')}
          >
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
