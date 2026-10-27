import React from 'react';
import { BOARD_POSITIONS, isBoardPosition, POINTS, positionLabel } from './boardModel';
import useBoardMotion from './useBoardMotion';
import TokenFace from './TokenFace';
import { teamInk } from './palette';
import { SpecialIcon, SPECIAL_TILES } from './SpecialTiles';
import './motion.css';

export default function Board({ game, selected = null, onSelect, onPlace, readOnly = false, drag }) {
  const motion = useBoardMotion(game);
  const groups = [];
  game.teams.forEach((team, teamIndex) => team.pieces.forEach((piece, pieceIndex) => {
    if (!isBoardPosition(piece.position) || groups.some(g => g.team === teamIndex && g.position === piece.position)) return;
    groups.push({ team: teamIndex, piece: pieceIndex, position: piece.position,
      indices: team.pieces.flatMap((p, i) => p.position === piece.position ? [i] : []) });
  }));
  return <div className={`yut-board ${selected ? 'is-placing' : ''}`} aria-label="윷놀이 판">
    <svg viewBox="0 0 600 600" aria-hidden="true">
      <rect x="23" y="23" width="554" height="554" className="yut-frame-shadow" />
      <rect x="20" y="20" width="554" height="554" className="yut-frame" />
      <path d="M96 96L504 504M504 96L96 504" className="yut-diagonal" />
      {BOARD_POSITIONS.filter(id => id !== 'center').map(id => <circle key={id} cx={POINTS[id][0]} cy={POINTS[id][1]}
        r={[5, 10, 15, 20].includes(id) ? 23 : 16} className={[5, 10, 15, 20].includes(id) ? 'yut-corner' : 'yut-dot'} />)}
      <circle cx="300" cy="300" r="25" fill="#5486ba" />
      <path d="M275 300 A25 25 0 0 1 325 300 A12.5 12.5 0 0 0 300 300 A12.5 12.5 0 0 1 275 300" fill="#dc625b" />
    </svg>
    {SPECIAL_TILES.filter(tile => isBoardPosition(game.specials?.[tile.kind])).map(tile => <span key={tile.kind}
      className="yut-board-special" role="img" aria-label={`${positionLabel(game.specials[tile.kind])} · ${tile.name} 발판`}
      style={{ left: `${POINTS[game.specials[tile.kind]][0] / 6}%`, top: `${POINTS[game.specials[tile.kind]][1] / 6}%` }}>
      <SpecialIcon kind={tile.kind} />
    </span>)}
    {!readOnly && BOARD_POSITIONS.map(position => <button key={position} className="yut-cell"
      {...drag?.target(position)}
      style={{ left: `${POINTS[position][0] / 6}%`, top: `${POINTS[position][1] / 6}%` }}
      aria-label={`${positionLabel(position)}에 놓기`} title={positionLabel(position)} disabled={!selected && !drag?.dragging}
      onClick={() => onPlace(position)} />)}
    {groups.map(group => {
      const team = game.teams[group.team]; const point = POINTS[group.position];
      const active = selected?.team === group.team && group.indices.includes(selected?.piece);
      const label = `${team.name} ${group.indices.map(i => i + 1).join('·')}번 말${group.indices.length > 1 ? ` · ${group.indices.length}개 업음` : ''}`;
      const movement = motion.arrivals[`${group.team}-${group.position}`];
      const birth = motion.special?.kind === 'birth' && motion.special.team === group.team && motion.special.position === group.position;
      const tokenClass = `yut-token ${movement ? 'yut-moving' : ''} ${birth ? 'yut-birth-stack' : ''}`;
      const style = { left: `${point[0] / 6}%`, top: `${point[1] / 6}%`, '--team': team.color, '--team-ink': teamInk(team.color), ...movement };
      const contents = <TokenFace team={group.team} piece={group.piece} count={group.indices.length} />;
      return readOnly ? <span key={`${group.team}-${group.position}`} className={`${tokenClass} ${active ? 'selected' : ''}`} style={style} role="img" aria-label={label}>{contents}</span>
        : <button key={`${group.team}-${group.position}`} className={`${tokenClass} ${active ? 'selected' : ''}`} style={style}
          {...drag?.source({ team: group.team, piece: group.piece })} {...drag?.target(group.position)}
          aria-pressed={active} aria-label={selected && !active ? `${positionLabel(group.position)}에 놓기 · ${label}` : label}
          onClick={() => selected && !active ? onPlace(group.position) : onSelect({ team: group.team, piece: group.piece })}>{contents}</button>;
    })}
    {motion.special && (() => {
      const effect = motion.special;
      const point = POINTS[effect.position];
      const from = POINTS[effect.kind === 'hell' ? effect.from : 20] || POINTS[20];
      const style = { left: `${point[0] / 6}%`, top: `${point[1] / 6}%`, '--team': effect.color,
        '--team-ink': teamInk(effect.color), '--from-x': `${(from[0] - point[0]) / 54 * 100}%`,
        '--from-y': `${(from[1] - point[1]) / 54 * 100}%` };
      return <React.Fragment key={`special-${motion.sequence}`}>
        <span aria-hidden="true" className={`yut-special-aura yut-${effect.kind}-aura`} style={style} />
        <span aria-hidden="true" className={`yut-token yut-special-ghost yut-${effect.kind}-ghost`} style={style}>
          <TokenFace team={effect.team} piece={effect.kind === 'hell' ? effect.piece : effect.added} count={effect.kind === 'hell' ? effect.count : 1} />
        </span>
      </React.Fragment>;
    })()}
    {motion.captures.map(capture => <React.Fragment key={`${motion.sequence}-${capture.key}`}>
      <span aria-hidden="true" className="yut-token yut-captured" style={{
        left: `${POINTS[capture.position][0] / 6}%`, top: `${POINTS[capture.position][1] / 6}%`, '--team': capture.color, '--team-ink': teamInk(capture.color),
      }}><TokenFace team={capture.team} piece={capture.piece} count={capture.count} /></span>
      <span aria-hidden="true" className="yut-capture-burst" style={{
        left: `${POINTS[capture.position][0] / 6}%`, top: `${POINTS[capture.position][1] / 6}%`,
      }}>잡았다!</span>
    </React.Fragment>)}
  </div>;
}
