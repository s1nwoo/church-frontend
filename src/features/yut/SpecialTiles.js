import React from 'react';
import { positionLabel } from './boardModel';
import './specialTiles.css';

export const SPECIAL_TILES = [{ kind: 'birth', name: '한 명 더!' }, { kind: 'hell', name: '처음으로!' }];

export function SpecialIcon({ kind }) {
  return <svg viewBox="0 0 80 80" aria-hidden="true">
    <circle cx="40" cy="40" r="36" fill={kind === 'birth' ? '#e4f4df' : '#f9e1dd'} stroke={kind === 'birth' ? '#40814a' : '#b54c40'} strokeWidth="4" />
    {kind === 'birth' ? <g fill="#40814a" stroke="#40814a" strokeWidth="3" strokeLinecap="round">
      <path d="M40 57V35" fill="none" /><path d="M39 42C23 43 20 31 22 25C35 25 40 31 39 42ZM41 35C41 22 52 20 60 22C59 34 51 39 41 35Z" />
      <path d="M29 58H51" />
    </g> : <path d="M40 15C45 30 60 34 58 47C56 67 25 69 22 48C20 38 27 30 32 27C30 38 36 40 38 34C42 26 40 21 40 15Z" fill="#b54c40" />}
  </svg>;
}

export default function SpecialTiles({ game, drag, setSpecial }) {
  return <section className="yut-card yut-special-settings">
    <h2>특수 발판</h2><p>원형 표식을 끌어 원하는 칸에 놓으세요.</p>
    <div className="yut-special-options">{SPECIAL_TILES.map(({ kind, name }) => <div key={kind}>
      <span className="yut-special-source" role="img" aria-label={`${name} 발판 표식`} {...drag.source({ special: kind })}>
        <SpecialIcon kind={kind} /><strong>{name}</strong>
      </span>
      <small>{game.specials?.[kind] != null ? positionLabel(game.specials[kind]) : '미설정'}</small>
      <button disabled={game.specials?.[kind] == null} onClick={() => setSpecial(kind, null)} aria-label={`${name} 발판 해제`}>해제</button>
    </div>)}</div>
    <p><b>한 명 더!</b> · 도착하면 합류할 대기 말 1개 선택</p>
    <p><b>처음으로!</b> · 도착한 말 전부 대기석으로</p>
    <p>각 1칸씩 설정합니다. 같은 칸에 놓으면 기존 표식을 교체합니다. 설정만 바꿀 때는 말에 효과가 적용되지 않습니다.</p>
  </section>;
}
