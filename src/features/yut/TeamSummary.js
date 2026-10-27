import React from 'react';
import { teamInk } from './palette';
export default function TeamSummary({ game, selected }) {
  return <section className="yut-scoreboard" aria-label={game.mode === 'individual' ? '참가자별 현황' : '팀별 현황'}>
    {game.teams.map((team, index) => {
      const finished = team.pieces.filter(p => p.position === 'finished').length;
      return <div className={`yut-score ${selected?.team === index ? 'yut-team-selected' : ''}`} key={index} style={{ '--team': team.color, '--team-ink': teamInk(team.color) }}>
        <span className="yut-team-number">{index + 1}</span>
        <div><h2>{team.name}</h2><span>대기 {team.pieces.filter(p => p.position === null).length} · 판 위 {team.pieces.length - finished - team.pieces.filter(p => p.position === null).length}</span></div>
        <strong>{finished}<small> / {team.pieces.length} 완주</small></strong>
      </div>;
    })}
  </section>;
}
