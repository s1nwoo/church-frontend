// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import ScrollToTop from './components/ScrollToTop';

import Header from './components/Header';
import MainIntroSection from './components/MainIntroSection';
import SermonSection from './components/SermonSection';
import InfoCardSection from './components/InfoCardSection';
import Footer from './components/Footer';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SignupRealNamePage from './pages/SignupRealNamePage'
import SignupExtraInfoPage from './pages/SignupExtraInfoPage';
import BibleTypingPage from './pages/BibleTypingPage';

import LocationPage from './pages/LocationPage';
import LogoGalleryPage from './pages/LogoGalleryPage';

import SermonDetailPage from './pages/SermonDetailPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="app-wrapper">
          <Header />

          {/* ✅ 메인인트로는 따로 렌더링 */}
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <MainIntroSection />

                  {/* ✅ 이후 섹션만 여백 적용 */}
                  <div className="page-container">
                    <SermonSection />
                  </div>
                  <InfoCardSection />
                </>
              }
            />
            <Route path="/login" element={<div className="page-container"><LoginPage /></div>} />
            <Route path="/signup" element={<div className="page-container"><SignupPage /></div>} />
            <Route path="/signup/realname" element={<div className="page-container"><SignupRealNamePage /></div>} />
            <Route path="/signup/extra" element={<div className="page-container"><SignupExtraInfoPage /></div>} />
            <Route path="/location" element={<div className="page-container"><LocationPage /></div>} />
            <Route path="/bible-practice" element={<div className="page-container"><BibleTypingPage /></div>} />
            <Route path="/logo-gallery" element={<div className="page-container"><LogoGalleryPage /></div>} />
            <Route path="/sermons/:id" element={<div className="page-container"><SermonDetailPage /></div>} />
          </Routes>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
