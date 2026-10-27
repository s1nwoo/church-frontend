import React from 'react';
import { teamInk } from './palette';

// Stable landing positions keep existing pieces still when another piece arrives.
const LANDINGS = [
  { left: '30%', top: '40%', rotate: '-16deg' },
  { left: '63%', top: '47%', rotate: '13deg' },
  { left: '42%', top: '69%', rotate: '-7deg' },
  { left: '70%', top: '76%', rotate: '24deg' },
];

export default function FinishedPieces({ game, drag, selected }) {
  return <aside className="yut-finish" aria-label={game.mode === 'individual' ? '참가자별 완주한 말' : '팀별 완주한 말'}>
    {game.teams.map((team, teamIndex) => {
      const finished = team.pieces.filter(piece => piece.position === 'finished').length;
      return <section className="yut-finish-team" key={teamIndex} style={{ '--team': team.color, '--team-ink': teamInk(team.color) }}
        aria-label={`${team.name} 완주 공간`} {...drag?.target('finished', teamIndex)}>
        <h2>{team.name}<span>{finished === team.pieces.length ? (game.mode === 'individual' ? '완주!' : '모두 완주!') : `완주 ${finished}`}</span></h2>
        <div className="yut-finish-pile">
          {!finished && <span className="yut-finish-empty">{drag ? '완주한 말을 여기에 놓으세요' : '완주한 말이 모여요'}</span>}
          {team.pieces.map((piece, index) => piece.position === 'finished' &&
            <span key={index} className={`yut-finished-piece ${selected?.team === teamIndex && selected?.piece === index ? 'selected' : ''}`} role="img"
              {...drag?.source({ team: teamIndex, piece: index })}
              aria-label={`${team.name} ${index + 1}번 말 완주`}
              style={{ left: LANDINGS[index].left, top: LANDINGS[index].top, '--tilt': LANDINGS[index].rotate }}>
              <b>{teamIndex + 1}</b><small>{index + 1}번</small>
            </span>)}
        </div>
      </section>;
    })}
  </aside>;
}
