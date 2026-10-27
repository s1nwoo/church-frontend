import { useState } from 'react';
export default function useFullscreen(root) {
  const [error, setError] = useState('');
  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current.requestFullscreen();
      setError('');
    } catch { setError('전체 화면 전환이 지원되지 않습니다. 브라우저의 F11 키를 사용해 주세요.'); }
  }
  return { toggle, error };
}
