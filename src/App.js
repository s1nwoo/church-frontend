// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import ScrollToTop from './components/ScrollToTop';

import Header from './components/Header';
import MainIntroSection from './components/MainIntroSection';
import SermonSection from './components/SermonSection';
import Footer from './components/Footer';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SignupRealNamePage from './pages/SignupRealNamePage';
import SignupExtraInfoPage from './pages/SignupExtraInfoPage';
import BibleTypingPage from './pages/BibleTypingPage';
import LocationPage from './pages/LocationPage';
import LogoGalleryPage from './pages/LogoGalleryPage';
import SermonDetailPage from './pages/SermonDetailPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SermonManagePage from './pages/admin/SermonManagePage';
import PostManagePage from './pages/admin/PostManagePage';
import WorshipInfoPage from './pages/WorshipInfoPage';
import ChurchIntroPage from './pages/ChurchIntroPage';
import ChurchHistoryPage from './pages/ChurchHistoryPage';
import PostsPage from './pages/PostsPage';
import PostDetailPage from './pages/PostDetailPage'
import MemberManagePage from './pages/admin/MemberManagePage'
import ProfilePage from './pages/ProfilePage'; // ✅ 내 정보 페이지

// 전체목록 페이지 컴포넌트
import AllSermonsPage from './pages/AllSermonsPage';
// 상세페이지 컴포넌트 (파라미터 기반)
import WorshipMediaPage from './pages/WorshipMediaPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="app-wrapper">
          <Header />

          <Routes>
            <Route
              path="/"
              element={
                <>
                  <MainIntroSection />
                  <div className="page-container"></div>
                  <SermonSection />
                </>
              }
            />

            <Route path="/login" element={<div className="page-container"><LoginPage /></div>} />
            <Route path="/signup" element={<div className="page-container"><SignupPage /></div>} />
            <Route path="/signup/realname" element={<div className="page-container"><SignupRealNamePage /></div>} />
            <Route path="/signup/extra" element={<div className="page-container"><SignupExtraInfoPage /></div>} />
            <Route path="/profile" element={<div className="page-container"><ProfilePage /></div>} /> {/* ✅ 내 정보 */}
            <Route path="/location" element={<div className="page-container"><LocationPage /></div>} />
            <Route path="/bible-practice" element={<div className="page-container"><BibleTypingPage /></div>} />
            <Route path="/logo-gallery" element={<div className="page-container"><LogoGalleryPage /></div>} />
            <Route path="/sermons/:id" element={<div className="page-container"><SermonDetailPage /></div>} />
            <Route path="/admin" element={<div className="page-container"><AdminDashboardPage /></div>} />
            <Route path="/admin/sermons" element={<div className="page-container"><SermonManagePage /></div>} />
            <Route path="/admin/posts" element={<div className="page-container"><PostManagePage /></div>} />
            <Route path="/admin/members" element={<div className="page-container"><MemberManagePage /></div>} />
            <Route path="/worship-info" element={<div className="page-container"><WorshipInfoPage /></div>} />
            <Route path="/church-intro" element={<div className="page-container"><ChurchIntroPage /></div>} />
            <Route path="/church-history" element={<div className="page-container"><ChurchHistoryPage /></div>} />
            <Route path="/posts" element={<div className="page-container"><PostsPage /></div>} />
            <Route path="/posts/:id" element={<div className="page-container"><PostDetailPage/></div>} />
            {/* ──────────────────────────────────────────── */}
            {/* 예배와 훈련 (설교 영상) 전체목록 / 상세 */}
            <Route path="/worship-media" element={<Navigate to="all" replace />} />
            <Route path="/worship-media/all" element={<div className="page-container"><AllSermonsPage /></div>} />
            <Route path="/worship-media/:id" element={<div className="page-container"><WorshipMediaPage /></div>} />
            {/* ──────────────────────────────────────────── */}

          </Routes>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;