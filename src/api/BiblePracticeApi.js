// src/api/BiblePracticeApi.js

import axios from 'axios';

// 책 목록 조회
export const getBibleBooks = () =>
  axios
    .get('/api/bible-practice/books')
    .then(res => res.data);

// 선택한 책의 장 목록 조회
export const getBibleChapters = (bookCode) =>
  axios
    .get('/api/bible-practice/chapters', { params: { bookCode } })
    .then(res => res.data);

// 선택한 책·장의 절 목록 조회
export const getBibleVerses = (bookCode, chapter) =>
  axios
    .get('/api/bible-practice/verses', { params: { bookCode, chapter } })
    .then(res => res.data);

// 특정 구절 조회
export const getVerse = (bookCode, chapter, verse) =>
  axios
    .get('/api/bible-practice/verse', { params: { bookCode, chapter, verse } })
    .then(res => res.data);

// 저장된 진행 위치 조회
export const getBibleProgress = (bookCode) =>
  axios
    .get('/api/bible-practice/progress', { params: { bookCode } })
    .then(res => res.data);

// 진행 위치 저장/갱신
export const saveBibleProgress = (bookCode, chapter, verse) =>
  axios
    .post('/api/bible-practice/progress', { bookCode, chapter, verse })
    .then(res => res.data);
