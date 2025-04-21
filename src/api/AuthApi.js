// src/api/AuthApi.js
import axios from 'axios';

// 로그인 처리 (세션에 userId, role 세팅)
export const login = (credentials) =>
  axios.post('/api/auth/login', credentials);

// 현재 로그인된 사용자 정보 가져오기
export const getCurrentUser = () =>
  axios.get('/api/auth/me');

// 로그아웃 처리
export const logout = () =>
  axios.post('/api/auth/logout');
