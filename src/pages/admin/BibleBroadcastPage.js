import React from 'react';
import { BibleSlideStudio } from './BiblePptPage';

/**
 * 관리자 메뉴 ‘성경 송출’: 예배 중 노트북에서 빔 프로젝터로 성경 구절을 띄운다.
 * 화면 위쪽 전체는 슬라이드 목록(썸네일·✂ 나누기·순서 바꾸기), 맨 아래는 빔 화면 송출 패널(구절 입력 포함).
 * 슬라이드 목록과 글자 크기·위치 설정은 ‘성경 PPT 만들기’와 같은 것을 공유한다(다른 탭에서 바꿔도 바로 반영).
 */
export default function BibleBroadcastPage() {
  return <BibleSlideStudio mode="broadcast" />;
}
