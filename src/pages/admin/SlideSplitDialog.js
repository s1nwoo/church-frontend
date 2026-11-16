import React, { useEffect, useMemo, useRef, useState } from 'react';

// ‘~며, ~니, ~고, ~되…’처럼 문장이 자연스럽게 끊기는 어미나 문장부호. 자를 곳을 추천할 때만 쓴다(자동으로 자르지 않는다).
const NATURAL_END = /(며|니|고|되|매|라|다|면)$|[,.!?]$/;

/** 본문을 단어와 그 뒤 공백으로 나눈다. 줄바꿈(합친 슬라이드의 절 구분)도 그대로 보존한다. */
export function splitWords(body) {
  const words = [], re = /(\S+)(\s*)/g;
  let match;
  while ((match = re.exec(body))) words.push({ text: match[1], sep: match[2] });
  return words;
}

/** cuts(단어 번호 집합)의 각 단어 뒤에서 잘라 여러 장의 본문으로 만든다. */
export function joinParts(words, cuts) {
  const parts = [];
  let current = '';
  words.forEach((word, i) => {
    current += word.text;
    if (cuts.has(i)) { parts.push(current.trim()); current = ''; } else current += word.sep;
  });
  parts.push(current.trim());
  return parts.filter(Boolean);
}

/**
 * 송출 모드에서도 쓰는 구절 나누기 창. 단어 사이를 클릭해 자를 곳을 고르면 아래에 나뉜 결과가 바로 보이고,
 * ‘N장으로 나누기’를 누르면 onSplit(본문 목록)을 부른다.
 */
export default function SlideSplitDialog({ slide, aspect, renderPart, onCancel, onSplit }) {
  const words = useMemo(() => splitWords(slide.body), [slide.body]);
  const [cuts, setCuts] = useState(() => new Set());
  const boxRef = useRef(null);
  useEffect(() => { boxRef.current?.focus(); }, []);
  const parts = joinParts(words, cuts);
  const partsKey = JSON.stringify(parts);

  // 나뉜 각 장을 실제 송출 화면과 같은 방식(서버 렌더링)으로 그린다. 고를 때마다 0.3초 뒤에 그리고, 한 번 그린 본문은 다시 그리지 않는다.
  const [images, setImages] = useState({});   // 본문 → 그림 주소(null이면 실패)
  const urls = useRef(new Map()), pending = useRef(new Set());
  useEffect(() => {
    if (!renderPart) return undefined;
    const timer = setTimeout(() => {
      JSON.parse(partsKey).forEach(body => {
        if (urls.current.has(body) || pending.current.has(body)) return;
        pending.current.add(body);
        renderPart(body)
          .then(blob => { const url = URL.createObjectURL(blob); urls.current.set(body, url); setImages(m => ({ ...m, [body]: url })); })
          .catch(() => setImages(m => ({ ...m, [body]: null })))
          .finally(() => pending.current.delete(body));
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [partsKey, renderPart]);
  useEffect(() => {
    const made = urls.current;
    return () => made.forEach(url => URL.revokeObjectURL(url));
  }, []);
  const toggle = i => setCuts(old => {
    const next = new Set(old);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return <div className="bp-split-backdrop" onPointerDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
    <div className="bp-split-dialog" role="dialog" aria-modal="true" aria-labelledby="bp-split-title" tabIndex={-1} ref={boxRef}
      onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } }}>
      <div className="bp-split-head">
        <h2 id="bp-split-title">{slide.title} 나누기</h2>
        <button type="button" aria-label="닫기" onClick={onCancel}>✕</button>
      </div>
      <p className="bp-split-text">{words.map((word, i) => <React.Fragment key={i}>
        <span className="bp-split-word">{word.text}</span>
        {i < words.length - 1 && <button type="button" aria-pressed={cuts.has(i)} aria-label={`‘${word.text}’ 뒤에서 자르기`}
          className={`bp-split-gap ${cuts.has(i) ? 'is-cut' : NATURAL_END.test(word.text) ? 'is-natural' : ''}`} onClick={() => toggle(i)}>｜</button>}
        {i < words.length - 1 && word.sep.includes('\n') && <br />}
      </React.Fragment>)}</p>
      <p className="bp-help bp-split-hint">단어 사이를 클릭하면 자를 곳(주황)이 표시되고, 다시 누르면 취소됩니다. 여러 곳을 고르면 여러 장으로 나뉩니다.
        흐린 ｜는 ‘~며, ~니, ~고’처럼 자연스럽게 끊기는 곳 추천입니다.</p>
      <ol className="bp-split-result" aria-label="나눈 결과 (실제 송출 화면)">{parts.map((part, i) => <li key={i}>
        <strong>{parts.length > 1 ? `${i + 1}장` : '나누기 전'}</strong>
        <div className="bp-split-shot" style={{ aspectRatio: aspect }}>
          {images[part] ? <img src={images[part]} alt={`${i + 1}장 송출 화면: ${part}`} draggable="false" />
            : <span>{images[part] === null ? '화면을 그리지 못했습니다' : '화면 그리는 중…'}</span>}
        </div>
      </li>)}</ol>
      <div className="bp-split-actions">
        <button type="button" disabled={!cuts.size} onClick={() => setCuts(new Set())}>다시 고르기</button>
        <button type="button" onClick={onCancel}>취소</button>
        <button type="button" className="bp-primary" disabled={parts.length < 2} onClick={() => onSplit(parts)}>
          {parts.length < 2 ? '나누기' : `${parts.length}장으로 나누기`}</button>
      </div>
    </div>
  </div>;
}
