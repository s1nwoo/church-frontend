import { useLayoutEffect, useRef, useState } from 'react';
import { isBoardPosition, POINTS } from './boardModel';

export function boardTransitions(previous, game) {
  const arrivals = {};
  const captures = [];
  if (!previous || previous.teams.length !== game.teams.length) return { arrivals, captures };
  const forward = game.log[1] === previous.log[0];
  game.teams.forEach((team, t) => team.pieces.forEach((piece, p) => {
    const old = previous.teams[t]?.pieces[p]?.position;
    if (old === undefined || old === piece.position) return;
    if (isBoardPosition(piece.position)) {
      const key = `${t}-${piece.position}`;
      const from = POINTS[old] || POINTS[20];
      const to = POINTS[piece.position];
      if (!arrivals[key] || isBoardPosition(old)) arrivals[key] = { '--from-x': `${(from[0] - to[0]) / 54 * 100}%`,
        '--from-y': `${(from[1] - to[1]) / 54 * 100}%` };
    }
    if (forward && isBoardPosition(old) && piece.position === null &&
      game.teams.some((other, i) => i !== t && other.pieces.some(q => q.position === old))) {
      const key = `${t}-${old}`;
      const existing = captures.find(c => c.key === key);
      if (existing) existing.count += 1;
      else captures.push({ key, team: t, piece: p, position: old, color: team.color, count: 1 });
    }
  }));
  const action = game.lastAction;
  const special = forward && ['hell', 'birth'].includes(action?.kind) && isBoardPosition(action.position)
    && game.teams[action.team]?.pieces[action.piece] && Number.isInteger(action.count) && action.count >= 1 && action.count <= 4
    ? { ...action, color: game.teams[action.team].color } : null;
  if (special?.kind === 'birth') {
    const from = POINTS[special.from] || POINTS[20];
    const to = POINTS[special.position];
    arrivals[`${special.team}-${special.position}`] = { '--from-x': `${(from[0] - to[0]) / 54 * 100}%`, '--from-y': `${(from[1] - to[1]) / 54 * 100}%` };
  }
  return { arrivals, captures, ...(special ? { special } : {}) };
}

export default function useBoardMotion(game) {
  const previous = useRef(game);
  const sequence = useRef(0);
  const [motion, setMotion] = useState({ arrivals: {}, captures: [], sequence: 0 });
  useLayoutEffect(() => {
    const changes = boardTransitions(previous.current, game);
    previous.current = game;
    sequence.current += 1;
    setMotion({ ...changes, sequence: sequence.current });
    const timer = setTimeout(() => setMotion(current => ({ ...current, arrivals: {}, captures: [], special: null })), 1700);
    return () => clearTimeout(timer);
  }, [game]);
  return motion;
}
