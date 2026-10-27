import { createGame, placePieces, setSpecialTile } from './engine';
import { loadGame, parseSnapshot, STORAGE_KEY } from './storage';

test('manual placement works without throw results or turn restrictions', () => {
  const original = createGame();
  const next = placePieces(original, { team: 1, piece: 2 }, 'center');
  expect(next.teams[1].pieces[2].position).toBe('center');
  expect(original.teams[1].pieces[2].position).toBeNull();
});
test('placing on an opponent captures the whole opposing stack', () => {
  let game = createGame();
  game = placePieces(game, { team: 1, piece: 0 }, 5);
  game = placePieces(game, { team: 1, piece: 1 }, 5);
  game = placePieces(game, { team: 0, piece: 0 }, 5);
  expect(game.teams[1].pieces.every(p => p.position === null)).toBe(true);
  expect(game.teams[0].pieces[0].position).toBe(5);
  expect(game.log[0]).toContain('2개 잡기');
});
test('allied stack always moves together', () => {
  let game = createGame();
  game = placePieces(game, { team: 0, piece: 0 }, 5);
  game = placePieces(game, { team: 0, piece: 1 }, 5);
  game = placePieces(game, { team: 0, piece: 1 }, 'center');
  expect(game.teams[0].pieces.slice(0, 2).map(p => p.position)).toEqual(['center', 'center']);
  game = placePieces(game, { team: 0, piece: 1 }, 10, false);
  expect(game.teams[0].pieces.slice(0, 2).map(p => p.position)).toEqual([10, 10]);
});

test('birth adds exactly one reserve piece to an arriving stack and does not recurse', () => {
  let game = setSpecialTile(createGame(), 'birth', 'center');
  expect(placePieces(game, { team: 0, piece: 0 }, 'center')).toBe(game);
  const next = placePieces(game, { team: 0, piece: 0 }, 'center', 1);
  expect(next.teams[0].pieces.map(p => p.position)).toEqual(['center', 'center', null, null]);
  expect(game.teams[0].pieces.every(p => p.position === null)).toBe(true);
  game = placePieces(next, { team: 0, piece: 0 }, 5);
  game = placePieces(game, { team: 0, piece: 2 }, 'finished');
  game = placePieces(game, { team: 0, piece: 3 }, 'finished');
  game = placePieces(game, { team: 0, piece: 0 }, 'center');
  expect(game.teams[0].pieces.map(p => p.position)).toEqual(['center', 'center', 'finished', 'finished']);
});

test('birth uses the chosen reserve piece and rejects a moving or unavailable piece', () => {
  const game = setSpecialTile(createGame(), 'birth', 5);
  expect(placePieces(game, { team: 0, piece: 0 }, 5, 0)).toBe(game);
  const next = placePieces(game, { team: 0, piece: 0 }, 5, 3);
  expect(next.teams[0].pieces.map(p => p.position)).toEqual([5, null, null, 5]);
  expect(next.lastAction).toMatchObject({ kind: 'birth', added: 3, position: 5 });
});

test('hell returns the arriving stack, with no effect when configuring an occupied tile', () => {
  let game = placePieces(createGame(), { team: 0, piece: 0 }, 5);
  game = placePieces(game, { team: 0, piece: 1 }, 5);
  game = setSpecialTile(game, 'hell', 5);
  expect(game.teams[0].pieces[0].position).toBe(5);
  game = setSpecialTile(game, 'hell', 'center');
  game = placePieces(game, { team: 0, piece: 0 }, 'center');
  expect(game.teams[0].pieces.every(p => p.position === null)).toBe(true);
  expect(game.log[0]).toContain('지옥');
});

test('special tile settings roundtrip and overlap replaces the other marker', () => {
  let game = setSpecialTile(createGame(), 'birth', 5);
  game = setSpecialTile(game, 'hell', 5);
  expect(game.specials).toEqual({ birth: null, hell: 5 });
  expect(parseSnapshot(game).game.specials).toEqual(game.specials);
  expect(setSpecialTile(game, 'hell', 'bad')).toBe(game);
});
test('reserve pieces are independent; finish and reserve allow subsequent corrections', () => {
  let game = placePieces(createGame(), { team: 0, piece: 0 }, 'finished');
  expect(game.teams[0].pieces[1].position).toBeNull();
  game = placePieces(game, { team: 0, piece: 0 }, 20);
  expect(game.teams[0].pieces[0].position).toBe(20);
  game = placePieces(game, { team: 0, piece: 0 }, null);
  expect(game.teams[0].pieces[0].position).toBeNull();
});
test('invalid selections and same-position clicks do not create placements', () => {
  const game = createGame();
  expect(placePieces(game, null, 5)).toBe(game);
  expect(placePieces(game, { team: 9, piece: 0 }, 5)).toBe(game);
  expect(placePieces(game, { team: 0, piece: 0 }, 'bad')).toBe(game);
  expect(placePieces(game, { team: 0, piece: 0 }, null)).toBe(game);
});
test('legacy saved positions survive migration into manual mode', () => {
  const legacy = { ...createGame(), version: 1, throws: 1, results: [{ name: '모', steps: 5 }] };
  legacy.teams[0].pieces[0].position = 'center';
  const migrated = parseSnapshot(JSON.stringify(legacy));
  expect(migrated.game.version).toBe(2);
  expect(migrated.game.teams[0].pieces[0].position).toBe('center');
  expect(migrated.game.results).toBeUndefined();
  expect(migrated.history).toEqual([]);
});
test('valid saved history roundtrips and corrupted history is rejected', () => {
  const previous = createGame();
  const snapshot = { format: 2, revision: 2, game: placePieces(previous, { team: 0, piece: 0 }, 5), history: [previous] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  expect(loadGame(localStorage).snapshot).toEqual(snapshot);
  expect(() => parseSnapshot({ ...snapshot, history: [{}] })).toThrow();
  localStorage.setItem(STORAGE_KEY, '{broken');
  expect(loadGame(localStorage).error).toBeTruthy();
});

test('ten-player individual game roundtrips, has one piece each and no birth reserve', () => {
  let game = createGame(Array.from({ length: 10 }, (_, i) => `${i + 1}번 참가자`), 4, undefined, 'individual');
  expect(game.teams.every(t => t.pieces.length === 1)).toBe(true);
  expect(new Set(game.teams.map(t => t.color)).size).toBe(10);
  expect(parseSnapshot(game).game.mode).toBe('individual');
  game = setSpecialTile(game, 'birth', 'center');
  game = placePieces(game, { team: 9, piece: 0 }, 'center');
  expect(game.teams[9].pieces[0].position).toBe('center');
  expect(game.log[0]).toContain('대기 말 없음');
  expect(() => parseSnapshot({ ...game, mode: 'team' })).toThrow();
});
