// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// 1) 세션 쿠키(JSESSIONID) 전송
axios.defaults.withCredentials = true;
// 2) 백엔드 기본 URL
axios.defaults.baseURL = 'http://localhost:8080';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
