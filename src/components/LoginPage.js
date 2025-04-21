// src/components/LoginPage.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage({ setIsLoggedIn, setUserName, setUserRole }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  // axios 전역 설정(이 파일 최상단에 한 번만 해도 좋습니다)
  axios.defaults.withCredentials = true;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // 1) 로그인 요청 (쿠키 발급 위해 withCredentials 필수)
      await axios.post(
        '/api/auth/login',
        form,
        { withCredentials: true }
      );

      // 2) 로그인 성공 후, 사용자 정보 가져오기 (역시 쿠키 포함)
      const res = await axios.get(
        '/api/auth/me',
        { withCredentials: true }
      );

      // 3) App 전역 상태 업데이트
      setIsLoggedIn(true);
      setUserName(res.data.name);
      setUserRole(res.data.role);

      // 4) 홈으로 이동
      navigate('/');
    } catch (err) {
      console.error('로그인 에러', err);
      alert(err.response?.data || '로그인에 실패했습니다.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>아이디</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>비밀번호</label>
          <input
            type="password"D
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          로그인
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
