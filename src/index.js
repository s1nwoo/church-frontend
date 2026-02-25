import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// 세션 쿠키(JSESSIONID) 전송
axios.defaults.withCredentials = true;

// 백엔드 기본 URL 설정 (환경변수 우선, 없으면 로컬)
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);