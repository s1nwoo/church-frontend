// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';

import Header from './components/Header';
import MainIntroSection from './components/MainIntroSection';
import SermonSection from './components/SermonSection';
import InfoCardSection from './components/InfoCardSection';
import Footer from './components/Footer';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SignupRealNamePage from './pages/SignupRealNamePage'
import SignupExtraInfoPage from './pages/SignupExtraInfoPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-wrapper">
          <Header />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <MainIntroSection />
                  <SermonSection />
                  <InfoCardSection />
                </>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup/realname" element={<SignupRealNamePage />} />
            <Route path="/signup/extra" element={<SignupExtraInfoPage />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
