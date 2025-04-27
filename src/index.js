import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// 1) 세션 쿠키(JSESSIONID) 전송
axios.defaults.withCredentials = true;

// 2) 백엔드 기본 URL 설정
if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'https://church-s7rv.onrender.com'; // 🔥 배포용 Render 서버 주소
} else {
  axios.defaults.baseURL = 'http://localhost:8080'; // 🔥 로컬 개발용 서버 주소
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
