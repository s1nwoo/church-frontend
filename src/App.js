// src/App.js

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

  return (
    <BrowserRouter>
      <Header isLoggedIn={isLoggedIn} userName={userName} setIsLoggedIn={setIsLoggedIn} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/posts" element={<PostList />} />
        <Route path="/posts/new" element={<PostForm />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/posts/:id/edit" element={<PostEdit />} />
        <Route path="/bible-practice" element={<BiblePracticePage />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUserName={setUserName} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
