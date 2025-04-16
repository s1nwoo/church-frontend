// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home'; // ✅ 추가
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import PostDetail from './components/PostDetail';
import PostEdit from './components/PostEdit';
import BiblePracticePage from './components/BiblePracticePage'; // 추가
import LocationPage from './components/LocationPage'; // 추가
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
      <Header /> {/* ✅ 여기서 Header 항상 렌더링 */}
        <Routes>
          <Route path="/" element={<Home />} /> {/* ✅ 수정 */}
          <Route path="/posts" element={<PostList />} /> {/* ✅ 경로 변경 */}
          <Route path="/posts/new" element={<PostForm />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/posts/:id/edit" element={<PostEdit />} />
          <Route path="/bible-practice" element={<BiblePracticePage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
