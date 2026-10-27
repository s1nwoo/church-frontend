import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './fonts/a2z.css'; // 에이투지체 폰트 정의(정의만, 적용은 컴포넌트 CSS에서)
import App from './App';
import axios from 'axios';
import DevelopmentNotice, { resetDevelopmentSession } from './components/DevelopmentNotice';

// 세션 쿠키(JSESSIONID) 전송
axios.defaults.withCredentials = true;

// 백엔드 기본 URL 설정 (환경변수 우선, 없으면 로컬)
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
if (process.env.NODE_ENV === 'development') {
  try { resetDevelopmentSession(window.localStorage, axios.defaults.baseURL); }
  catch { console.warn('개발 환경의 로그인 상태를 초기화하지 못했습니다. 다시 로그인해 주세요.'); }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <><DevelopmentNotice /><App /></>
);
