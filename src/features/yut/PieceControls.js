import React from 'react';
import { positionLabel } from './boardModel';
import SpecialTiles from './SpecialTiles';
export default function PieceControls({ game, selected, onSelect, drag, setSpecial }) {
  return <aside className="yut-controls">
    <section className="yut-card yut-selection">
      <h2>말 선택</h2><p>말을 끌어 윷판에 놓으세요. 완주한 말은 왼쪽 완주 공간에서 끌어오면 됩니다.</p>
      {game.teams.map((t, teamIndex) => <div className="yut-team-tray" key={teamIndex} style={{ '--team': t.color }}>
        <h3><span>{teamIndex + 1}</span> {t.name}</h3>
        <div className="yut-pieces">{t.pieces.map((piece, pieceIndex) => <button key={pieceIndex}
          {...(piece.position !== 'finished' ? drag?.source({ team: teamIndex, piece: pieceIndex }) : {})}
          aria-label={`${t.name} ${pieceIndex + 1}번 말 · ${positionLabel(piece.position)}`}
          aria-pressed={selected?.team === teamIndex && selected?.piece === pieceIndex}
          disabled={piece.position === 'finished'}
          onClick={() => {
            onSelect({ team: teamIndex, piece: pieceIndex });
          }}>
          <b>{pieceIndex + 1}</b><small>{piece.position === null ? '대기' : piece.position === 'finished' ? '완주' : '판 위'}</small>
        </button>)}</div>
        <div className="yut-reserve-drop" aria-label={`${t.name} 대기석`} {...drag?.target(null, teamIndex)}>대기석 · 여기로 끌어 놓기</div>
      </div>)}
    </section>
    <SpecialTiles game={game} drag={drag} setSpecial={setSpecial} />
  </aside>;
}
