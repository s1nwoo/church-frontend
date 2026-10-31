import { isBoardPosition, positionLabel } from './boardModel';
import { TEAM_PALETTE } from './palette';

export const TEAM_COLORS = TEAM_PALETTE.slice(0, 4).map(color => color.value);
export const DEFAULT_NAMES = ['사랑팀', '기쁨팀', '평안팀', '소망팀'];
export function createGame(names = DEFAULT_NAMES.slice(0, 2), pieceCount = 4, colors = TEAM_COLORS, mode = 'team') {
  return { version: 2, mode, teams: names.map((name, index) => ({
    name: name.trim() || (mode === 'individual' ? `${index + 1}번 참가자` : DEFAULT_NAMES[index]), color: colors[index] || TEAM_PALETTE[index].value,
    pieces: Array.from({ length: mode === 'individual' ? 1 : pieceCount }, () => ({ position: null })),
  })), log: ['말을 선택하고 원하는 칸에 놓아 주세요.'] };
}
export function stackIndices(game, selection) {
  const team = game.teams[selection?.team];
  const piece = team?.pieces[selection?.piece];
  if (!piece) return [];
  if (!isBoardPosition(piece.position)) return [selection.piece];
  return team.pieces.flatMap((p, index) => p.position === piece.position ? [index] : []);
}
// One placement includes moving a stack and returning any captured opponents.
// No throw result, route, turn, or win condition restricts manual corrections.
export function birthCandidates(state, selection, position) {
  if (state.specials?.birth !== position || !isBoardPosition(position)) return [];
  const moving = stackIndices(state, selection);
  if (!moving.length || state.teams[selection.team].pieces[selection.piece].position === position) return [];
  return state.teams[selection.team].pieces.flatMap((piece, index) => piece.position === null && !moving.includes(index) ? [index] : []);
}

export function placePieces(state, selection, position, birthPiece) {
  if (position !== null && position !== 'finished' && !isBoardPosition(position)) return state;
  const source = state.teams[selection?.team]?.pieces[selection?.piece];
  if (!source || source.position === position) return state;
  const indices = stackIndices(state, selection);
  const candidates = birthCandidates(state, selection, position);
  if (candidates.length && !candidates.includes(birthPiece)) return state;
  const game = JSON.parse(JSON.stringify(state));
  const team = game.teams[selection.team];
  let caught = 0;
  const hell = isBoardPosition(position) && game.specials?.hell === position;
  delete game.lastAction;
  if (isBoardPosition(position) && !hell) {
    game.teams.forEach((other, index) => {
      if (index === selection.team) return;
      other.pieces.forEach(piece => {
        if (piece.position === position) { piece.position = null; caught += 1; }
      });
    });
  }
  indices.forEach(index => { team.pieces[index].position = hell ? null : position; });
  let effect = hell ? ` · 처음으로! ${indices.length}개 말 대기석으로` : '';
  if (isBoardPosition(position) && game.specials?.birth === position) {
    if (candidates.length) { team.pieces[birthPiece].position = position; effect = ` · 한 명 더! ${birthPiece + 1}번 말 합류`; }
    else effect = ' · 한 명 더! · 대기 말 없음';
  }
  if (hell || candidates.length) game.lastAction = {
    kind: hell ? 'hell' : 'birth', team: selection.team, piece: selection.piece,
    from: source.position, position, count: indices.length, ...(hell ? {} : { added: birthPiece }),
  };
  const label = indices.length > 1 ? `${indices.length}개 말` : `${selection.piece + 1}번 말`;
  const message = `${team.name} · ${label} → ${positionLabel(position)}${caught ? ` · 상대 말 ${caught}개 잡기` : ''}${effect}`;
  game.log = [message, ...game.log].slice(0, 60);
  return game;
}

export function setSpecialTile(state, kind, position) {
  if (!['birth', 'hell'].includes(kind) || (position !== null && !isBoardPosition(position))) return state;
  if ((state.specials?.[kind] ?? null) === position) return state;
  const specials = { birth: null, hell: null, ...state.specials, [kind]: position };
  const other = kind === 'birth' ? 'hell' : 'birth';
  if (position !== null && specials[other] === position) specials[other] = null;
  return { ...state, lastAction: null, specials, log: [`${kind === 'birth' ? '한 명 더!' : '처음으로!'} 발판 ${position === null ? '해제' : `${positionLabel(position)}에 설정`}`, ...state.log].slice(0, 60) };
}
