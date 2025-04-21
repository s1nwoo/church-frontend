// src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { getCurrentUser, logout as apiLogout } from './api/AuthApi';

import Header from './components/Header';
import Home from './components/Home';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import PostDetail from './components/PostDetail';
import PostEdit from './components/PostEdit';
import BiblePracticePage from './components/BiblePracticePage';
import LocationPage from './components/LocationPage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import SermonListPage from './components/SermonListPage';
import SermonCreatePage from './components/SermonCreatePage';
import SermonDetailPage from './components/SermonDetailPage';

import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName,   setUserName  ] = useState('');
  const [userRole,   setUserRole  ] = useState('');

  // 앱 초기 진입 시, 세션이 유효하면 사용자 정보 로드
  useEffect(() => {
    getCurrentUser()
      .then(res => {
        setIsLoggedIn(true);
        setUserName(res.data.name);
        setUserRole(res.data.role);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setUserName('');
        setUserRole('');
      });
  }, []);

  // 헤더의 로그아웃 버튼 클릭 시
  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.warn('logout error', e);
    } finally {
      setIsLoggedIn(false);
      setUserName('');
      setUserRole('');
    }
  };

  return (
    <BrowserRouter>
      <Header
        isLoggedIn={isLoggedIn}
        userName={userName}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={<Home />} />

        {/* 게시판 */}
        <Route path="/posts" element={<PostList />} />
        <Route path="/posts/new" element={<PostForm />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/posts/:id/edit" element={<PostEdit />} />

        {/* 성경 연습 */}
        <Route path="/bible-practice" element={<BiblePracticePage />} />

        {/* 지도 */}
        <Route path="/location" element={<LocationPage />} />

        {/* 회원가입 / 로그인 */}
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/login"
          element={
            <LoginPage
              setIsLoggedIn={setIsLoggedIn}
              setUserName={setUserName}
              setUserRole={setUserRole}
            />
          }
        />

        {/* 설교 영상 */}
        <Route path="/sermons" element={<SermonListPage />} />
        <Route path="/admin/sermons/new" element={<SermonCreatePage />} />
        <Route path="/sermons/:id" element={<SermonDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
