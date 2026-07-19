// src/utils/cardImageMap.js
// 카드 이미지 import (webpack 번들링 → S3 배포 시에도 정상 동작)
// ⚠️ 새 카드 이미지 추가 시 여기에 import 추가 후 재배포 필요

import card1 from '../components/images/card/card1.png';
import card2 from '../components/images/card/card2.png';
import card3 from '../components/images/card/card3.png';
import card4 from '../components/images/card/card4.png';
import card5 from '../components/images/card/card5.png';

/**
 * DB에 저장된 imageUrl 키 → 번들된 이미지 객체 매핑
 * - 로컬 이미지: "images/card/card1.png" 형태의 키 사용
 * - 외부 URL은 이 맵을 거치지 않고 그대로 사용
 */
export const LOCAL_IMAGE_MAP = {
  'images/card/card1.png': card1,
  'images/card/card2.png': card2,
  'images/card/card3.png': card3,
  'images/card/card4.png': card4,
  'images/card/card5.png': card5,
};

/**
 * imageUrl → 실제 표시 가능한 src 반환
 * @param {string} imageUrl - DB에 저장된 이미지 경로 or 외부 URL
 * @returns {string} - 렌더링 가능한 이미지 src
 */
export const resolveImageSrc = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;       // 외부 URL → 그대로
  return LOCAL_IMAGE_MAP[imageUrl] || '';                 // 로컬 키 → 번들 이미지
};

/**
 * <img> onError 핸들러.
 * - CloudFront 콜드 미스 등 "일시적" 로드 실패 시 잠시 후 자동 재시도한다.
 *   (기존 코드는 첫 실패에 src를 비워버려, 일시적 실패가 '이미지 실종'으로 굳는 문제가 있었음)
 * - 재시도까지 최종 실패하면 깨진 아이콘 대신 회색 placeholder만 남긴다.
 * @param {Event}  e         img error 이벤트
 * @param {string} imageUrl  원본 imageUrl (재시도용)
 * @param {number} maxRetries 최대 재시도 횟수
 */
export const handleImageError = (e, imageUrl, maxRetries = 2) => {
  const img = e.target;
  const src = resolveImageSrc(imageUrl);
  if (!src) { img.classList.add('img-load-error'); img.removeAttribute('src'); return; }

  const retries = Number(img.dataset.retryCount || 0);
  if (retries < maxRetries) {
    img.dataset.retryCount = String(retries + 1);
    // 캐시 우회 재요청(지연). CloudFront가 쿼리스트링을 캐시키로 쓰지 않으면 무시되고 정상 객체를 받는다.
    const sep = src.includes('?') ? '&' : '?';
    setTimeout(() => { img.src = `${src}${sep}_retry=${Date.now()}`; }, 600 * (retries + 1));
  } else {
    // 최종 실패: 깨진 아이콘 대신 회색 배경만 표시 (src는 영구히 비우되, 재조회 시 컴포넌트가 원복)
    img.classList.add('img-load-error');
    img.removeAttribute('src');
  }
};

/** 로드 성공 시 재시도 상태 초기화 (self-healing) */
export const handleImageLoad = (e) => {
  const img = e.target;
  if (img.dataset.retryCount) delete img.dataset.retryCount;
  img.classList.remove('img-load-error');
};

/**
 * 관리 페이지 프리셋 버튼용 목록
 */
export const PRESET_IMAGES = [
  { label: 'card1.png', value: 'images/card/card1.png' },
  { label: 'card2.png', value: 'images/card/card2.png' },
  { label: 'card3.png', value: 'images/card/card3.png' },
  { label: 'card4.png', value: 'images/card/card4.png' },
  { label: 'card5.png', value: 'images/card/card5.png' },
];
