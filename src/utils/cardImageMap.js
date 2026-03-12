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
 * 관리 페이지 프리셋 버튼용 목록
 */
export const PRESET_IMAGES = [
  { label: 'card1.png', value: 'images/card/card1.png' },
  { label: 'card2.png', value: 'images/card/card2.png' },
  { label: 'card3.png', value: 'images/card/card3.png' },
  { label: 'card4.png', value: 'images/card/card4.png' },
  { label: 'card5.png', value: 'images/card/card5.png' },
];
