import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getCurrentUser, logout as apiLogout } from './api/AuthApi';

import Header from './components/Header';
import MainIntroSection from './components/MainIntroSection'
import SermonSection from './components/SermonSection';
import InfoCardSection from './components/InfoCardSection';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Header />
      <MainIntroSection />
      <SermonSection />
      <InfoCardSection />
      <Footer />
    </>
  );
}


export default App;
