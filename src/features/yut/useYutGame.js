import { useCallback, useEffect, useRef, useState } from 'react';
import { placePieces, setSpecialTile } from './engine';
import { emptySnapshot, HISTORY_LIMIT, loadGame, parseSnapshot, STORAGE_KEY, SYNC_CHANNEL, validGame } from './storage';
const SELECTION_KEY = `${STORAGE_KEY}.selection`;
const PRESENTATION_KEY = `${STORAGE_KEY}.presentation`;
const validPresentation = value => value?.phase === 'game' || (value?.phase === 'setup' && validGame(value.game));

export default function useYutGame({ readOnly = false } = {}) {
  const [initial] = useState(() => {
    try { return loadGame(window.localStorage); }
    catch { return { snapshot: emptySnapshot(), error: '자동 저장을 사용할 수 없습니다.' }; }
  });
  const [snapshot, setSnapshot] = useState(initial.snapshot);
  const current = useRef(initial.snapshot);
  const channel = useRef(null);
  const [error, setError] = useState(initial.error);
  const [selected, updateSelected] = useState(null);
  const selectionRef = useRef(null);
  const [presentation, updatePresentation] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PRESENTATION_KEY));
      return validPresentation(saved) ? saved : null;
    } catch { return null; }
  });
  const presentationRef = useRef(presentation);
  const receivePresentation = useCallback(value => {
    if (!validPresentation(value)) return;
    presentationRef.current = value; updatePresentation(value);
  }, []);
  const setPresentation = useCallback(value => {
    if (readOnly || !validPresentation(value)) return;
    receivePresentation(value);
    try { window.localStorage.setItem(PRESENTATION_KEY, JSON.stringify(value)); } catch {}
    try { channel.current?.postMessage({ type: 'presentation', value }); } catch {}
  }, [readOnly, receivePresentation]);
  const showSetup = useCallback(game => setPresentation({ phase: 'setup', game }), [setPresentation]);
  const receiveSelection = useCallback(value => {
    const valid = value && Number.isInteger(value.team) && Number.isInteger(value.piece) &&
      current.current.game?.teams[value.team]?.pieces[value.piece];
    selectionRef.current = valid ? value : null;
    updateSelected(selectionRef.current);
  }, []);
  function setSelected(value) {
    if (readOnly) return;
    receiveSelection(value);
    try { window.localStorage.setItem(SELECTION_KEY, JSON.stringify(selectionRef.current)); } catch {}
    try { channel.current?.postMessage({ type: 'selection', value: selectionRef.current }); } catch {}
  }

  useEffect(() => {
    function receive(value) {
      try {
        const incoming = parseSnapshot(value);
        if (incoming.revision <= current.current.revision) return;
        current.current = incoming; setSnapshot(incoming); setError('');
      } catch { setError('경기 화면 동기화에 실패했습니다. 화면을 새로고침해 주세요.'); }
    }
    function onStorage(event) {
      if (event.key === STORAGE_KEY && event.newValue) receive(event.newValue);
      if (readOnly && event.key === SELECTION_KEY) {
        try { receiveSelection(JSON.parse(event.newValue)); } catch { receiveSelection(null); }
      }
      if (readOnly && event.key === PRESENTATION_KEY) {
        try { receivePresentation(JSON.parse(event.newValue)); } catch {}
      }
    }
    window.addEventListener('storage', onStorage);
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel.current = new BroadcastChannel(SYNC_CHANNEL);
        channel.current.onmessage = event => {
          if (event.data?.type === 'request') {
            if (!readOnly && current.current.game) {
              channel.current.postMessage({ type: 'snapshot', value: current.current });
              channel.current.postMessage({ type: 'selection', value: selectionRef.current });
            }
            if (!readOnly && presentationRef.current) channel.current.postMessage({ type: 'presentation', value: presentationRef.current });
          } else if (event.data?.type === 'snapshot') receive(event.data.value);
          else if (readOnly && event.data?.type === 'selection') receiveSelection(event.data.value);
          else if (readOnly && event.data?.type === 'presentation') receivePresentation(event.data.value);
        };
        channel.current.postMessage({ type: 'request' });
      }
    } catch { channel.current = null; }
    if (readOnly) {
      try { receiveSelection(JSON.parse(window.localStorage.getItem(SELECTION_KEY))); } catch {}
    } else {
      try { window.localStorage.removeItem(SELECTION_KEY); } catch {}
    }
    return () => { window.removeEventListener('storage', onStorage); channel.current?.close(); channel.current = null; };
  }, [readOnly, receiveSelection, receivePresentation]);

  function publish(game, history) {
    if (readOnly) return;
    setSelected(null);
    const next = { format: 2, revision: current.current.revision + 1, game, history };
    current.current = next; setSnapshot(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setError(''); }
    catch { setError('자동 저장에 실패했습니다. 경기 화면을 닫지 마세요. 빔 화면 연결도 확인해 주세요.'); }
    try { channel.current?.postMessage({ type: 'snapshot', value: next }); }
    catch { setError('빔 화면 전송에 실패했습니다. 빔 화면을 새로고침해 주세요.'); }
  }
  function place(selection, position, birthPiece) {
    const previous = current.current;
    if (readOnly || !previous.game) return;
    const next = placePieces(previous.game, selection, position, birthPiece);
    if (next === previous.game) return;
    publish(next, [...previous.history, previous.game].slice(-HISTORY_LIMIT));
  }
  function start(game) { publish(game, []); setPresentation({ phase: 'game' }); }
  function setSpecial(kind, position) {
    const previous = current.current;
    if (readOnly || !previous.game) return;
    const next = setSpecialTile(previous.game, kind, position);
    if (next !== previous.game) publish(next, [...previous.history, previous.game].slice(-HISTORY_LIMIT));
  }
  function undo() {
    const previous = current.current;
    if (readOnly || !previous.history.length) return;
    publish(previous.history[previous.history.length - 1], previous.history.slice(0, -1));
  }
  return { game: snapshot.game, presentation, showSetup, setPresentation, selected, setSelected, place, setSpecial, start, undo, canUndo: !readOnly && snapshot.history.length > 0,
    undoCount: snapshot.history.length, error };
}
