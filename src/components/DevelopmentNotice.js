import React from 'react';

export function resetDevelopmentSession(storage, apiUrl) {
  const marker = 'bhbc.dev.api';
  if (storage.getItem(marker) === apiUrl) return false;
  ['user', 'accessToken', 'refreshToken'].forEach(key => storage.removeItem(key));
  storage.setItem(marker, apiUrl);
  return true;
}

export default function DevelopmentNotice() {
  if (process.env.NODE_ENV !== 'development') return null;
  const live = process.env.REACT_APP_API_URL === 'https://api.bhbc.kr';
  return <div className="bhbc-development-notice" role="status" style={{ padding: '9px 16px', background: live ? '#fff0cd' : '#e8f1ff', color: '#25364b', fontFamily: "'A2z', 'Pretendard', sans-serif", fontSize: 14, lineHeight: 1.5, textAlign: 'center', fontWeight: 700 }}>
    {live ? '로컬 테스트 · 운영 데이터 사용 — 등록·수정·삭제하면 실제 홈페이지에 반영됩니다.' : '로컬 테스트 · 이 PC의 로컬 데이터 사용'}
  </div>;
}
