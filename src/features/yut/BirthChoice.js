import React, { useEffect, useRef } from 'react';

export default function BirthChoice({ team, candidates, onChoose, onCancel }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    if (typeof node.showModal === 'function') node.showModal();
    else node.setAttribute('open', '');
    node.querySelector('button')?.focus();
    return () => { if (typeof node.close === 'function') node.close(); };
  }, []);
  return <dialog ref={dialog} className="yut-birth-dialog" aria-labelledby="yut-birth-title" onCancel={event => { event.preventDefault(); onCancel(); }}>
    <h2 id="yut-birth-title">한 명 더! · 합류할 말을 골라 주세요</h2>
    <p>{team.name}의 대기 말 중 하나를 선택하면 도착한 말 위로 업힙니다.</p>
    <div className="yut-birth-choices">{candidates.map(index => <button key={index} onClick={() => onChoose(index)}>
      <span style={{ background: team.color }} aria-hidden="true" />{index + 1}번 말 합류
    </button>)}</div>
    <button onClick={onCancel}>이동 취소</button>
  </dialog>;
}
