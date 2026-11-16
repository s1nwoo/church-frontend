import React, { useEffect, useRef, useState } from 'react';
import { openProjectorChannel, projectorAction } from './admin/bibleProjector';
import './BibleProjectorPage.css';

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

// 빔 프로젝터에 띄우는 화면. 조작 화면(성경 PPT 만들기)이 BroadcastChannel로 보내는 이미지만 보여 준다.
export default function BibleProjectorPage() {
  const [image, setImage] = useState(''), [black, setBlack] = useState(false);
  const [fullscreen, setFullscreen] = useState(false), [connected, setConnected] = useState(false);
  const urlRef = useRef('');

  useEffect(() => {
    document.title = '빔 화면 · 성경 말씀';
    const channel = openProjectorChannel();
    const replace = next => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = next; setImage(next);
    };
    let latest = 0;
    if (channel) channel.onmessage = async ({ data }) => {
      if (!data) return;
      setConnected(true);
      if (data.type === 'show' && data.image) {
        const order = ++latest, url = URL.createObjectURL(data.image);
        // 디코딩이 끝난 뒤 바꿔야 슬라이드 사이에 빈 화면이 깜박이지 않는다.
        // 창이 가려져 그리기가 멈추면 decode가 끝나지 않으므로 최대 0.3초만 기다린다.
        try {
          const img = new Image(); img.src = url;
          await Promise.race([img.decode?.(), new Promise(resolve => setTimeout(resolve, 300))]);
        } catch { /* 그대로 표시 */ }
        if (order !== latest) { URL.revokeObjectURL(url); return; }
        replace(url); setBlack(false);
      } else if (data.type === 'black') setBlack(!!data.on);
      else if (data.type === 'clear') { latest++; replace(''); }
      else if (data.type === 'close') window.close();
      else if (data.type === 'ping') channel.postMessage({ type: 'hello' });
      else if (data.type === 'controller-closed') setConnected(false);
    };
    channel?.postMessage({ type: 'hello' });
    const bye = () => channel?.postMessage({ type: 'bye' });
    // 실수로 빔 화면 창을 클릭한 뒤 프레젠터를 눌러도 조작 화면이 넘겨받는다.
    const onKey = event => {
      if (event.key === 'f' || event.key === 'F') { toggleFullscreen(); return; }
      const action = projectorAction(event);
      if (action) { event.preventDefault(); channel?.postMessage({ type: 'key', action }); }
    };
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    window.addEventListener('pagehide', bye); window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      bye(); channel?.close();
      window.removeEventListener('pagehide', bye); window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreen);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  return <main className={`bible-projector ${fullscreen ? 'is-fullscreen' : ''}`} onDoubleClick={toggleFullscreen} aria-label="빔 화면">
    {image && <img src={image} alt="송출 중인 말씀 슬라이드" draggable="false" className={black ? 'is-hidden' : ''} />}
    {!fullscreen && <div className="bp-projector-hint">
      <strong>빔 화면</strong>
      <span>이 창을 프로젝터 화면으로 옮긴 뒤 <b>더블클릭</b>(또는 <b>F</b> 키)하면 전체 화면이 됩니다.</span>
      <span>{connected ? '조작 화면과 연결되었습니다.' : '노트북의 ‘성경 PPT 만들기’ 화면에서 슬라이드를 송출하세요.'}</span>
    </div>}
  </main>;
}
