// 노트북(조작 화면)과 빔 화면 창이 같은 브라우저 안에서 주고받는 약속.
// 빔 화면은 서버를 호출하지 않고, 조작 화면이 보내 주는 PNG만 표시한다.
export const PROJECTOR_CHANNEL = 'banghwa-bible-projector';
export const PROJECTOR_PATH = '/bible-projector';
export const PROJECTOR_WINDOW = 'banghwa-bible-projector';
// 빔 화면 송출용 해상도(px). 4:3 템플릿 기준 1600×1200으로 1080p 프로젝터까지 선명하다.
export const PROJECTOR_WIDTH = 1600;

export function openProjectorChannel() {
  return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(PROJECTOR_CHANNEL);
}

// 프레젠터(클리커)는 보통 PageUp/PageDown 또는 방향키, 검은 화면은 B나 마침표를 보낸다.
export function projectorAction(event) {
  const { key } = event;
  if (key === 'ArrowRight' || key === 'PageDown' || key === ' ') return 'next';
  if (key === 'ArrowLeft' || key === 'PageUp') return 'prev';
  if (key === 'b' || key === 'B' || key === '.') return 'black';
  return null;
}
