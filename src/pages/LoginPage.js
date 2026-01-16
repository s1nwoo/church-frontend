// src/pages/LoginPage.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // 입력 필드가 모두 채워졌는지 확인
  const isFormValid = username.trim() !== '' && password.trim() !== '';

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

      // 서버에서 받은 전체 응답 데이터
      const userData = response.data;
      console.log('로그인 응답', userData);

      // localStorage에 저장
      localStorage.setItem('accessToken', userData.accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Context에 전달
      login(userData);

      // 성공 후 메인 페이지로 이동
      navigate('/');
    } catch (error) {
      console.error(error);
      setError('아이디 또는 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* 환영 메시지 & 성경구절 */}
        <div className="welcome-section">
          <h1 className="welcome-title">
            <span className="church-name">방화침례교회</span>에 오신 여러분들을<br />
            <span className="highlight">환영</span>하고 <span className="highlight">축복</span>합니다.
          </h1>
          <p className="bible-verse">
            "내가 진실로 진실로 너희에게 이르노니<br />
            내 말을 듣고 또 나 보내신 이를 믿는 자는<br />
            영생을 얻었고 심판에 이르지 아니하나니<br />
            사망에서 생명으로 옮겼느니라"
          </p>
          <p className="bible-reference">요한복음 5:24</p>
        </div>

        {/* 로그인 폼 */}
        <form className="login-form" onSubmit={handleLogin}>
          {/* 아이디 입력 */}
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="아이디 입력"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              disabled={isLoading}
              required
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="input-wrapper password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* 아이디 저장 */}
          <div className="remember-me-section">
            <label className="remember-me">
              <input type="checkbox" />
              <span>아이디 저장</span>
            </label>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className={`login-btn ${isFormValid ? 'active' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          {/* 아이디/비밀번호 찾기, 회원가입 */}
          <div className="bottom-links">
            <button type="button" className="find-link">
              아이디/비밀번호 찾기
            </button>
            <span className="divider">|</span>
            <button
              type="button"
              className="signup-link"
              onClick={() => navigate('/signup')}
              disabled={isLoading}
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;