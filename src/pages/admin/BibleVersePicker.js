import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function BibleVersePicker({ book, onAdd, onClose }) {
  const dialog = useRef(null);
  const [ranges, setRanges] = useState(null);
  const [chapter, setChapter] = useState('');
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(1);
  const [error, setError] = useState('');
  useEffect(() => {
    const previousFocus = document.activeElement;
    if (dialog.current.showModal) dialog.current.showModal();
    else dialog.current.setAttribute('open', '');
    const controller = new AbortController();
    axios.get(`/api/admin/bible-ppt/books/${encodeURIComponent(book.abbreviation)}/ranges`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` }, signal: controller.signal
    }).then(({ data }) => {
      if (controller.signal.aborted) return;
      const first = Object.keys(data)[0];
      setRanges(data); setChapter(first); setStart(data[first][0]); setEnd(data[first][0]);
    }).catch(() => { if (!controller.signal.aborted) setError('장·절 정보를 불러오지 못했습니다. 창을 닫고 다시 선택해 주세요.'); });
    return () => { controller.abort(); previousFocus?.focus(); };
  }, [book]);
  const verses = ranges?.[chapter] || [];
  const token = `${book.abbreviation}${chapter}:${start}${start === end ? '' : `-${end}`}`;
  return <dialog ref={dialog} className="bp-verse-dialog" aria-labelledby="bp-picker-title"
    onCancel={e => { e.preventDefault(); onClose(); }}>
    <form onSubmit={e => { e.preventDefault(); if (ranges) onAdd(token); }}>
      <h2 id="bp-picker-title">{book.name} 장·절 선택</h2>
      {error ? <p role="alert">{error}</p> : !ranges ? <p role="status">장·절 불러오는 중…</p> : <>
        <div className="bp-range-fields">
          <label>장<select autoFocus value={chapter} onChange={e => {
            const next = e.target.value; setChapter(next); setStart(ranges[next][0]); setEnd(ranges[next][0]);
          }}>{Object.keys(ranges).map(v => <option key={v} value={v}>{v}장</option>)}</select></label>
          <label>시작 절<select value={start} onChange={e => { const next = Number(e.target.value); setStart(next); setEnd(next); }}>
            {verses.map(v => <option key={v} value={v}>{v}절</option>)}</select></label>
          <label>끝 절<select value={end} onChange={e => setEnd(Number(e.target.value))}>
            {verses.filter(v => v >= start).map(v => <option key={v} value={v}>{v}절</option>)}</select></label>
        </div><p className="bp-range-token">추가할 구절: <strong>{token}</strong></p>
      </>}
      <div className="bp-actions"><button type="button" onClick={onClose}>취소</button>
        <button className="bp-primary" disabled={!ranges}>구절 추가</button></div>
    </form>
  </dialog>;
}
