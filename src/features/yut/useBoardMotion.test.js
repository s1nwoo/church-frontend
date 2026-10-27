import { boardTransitions } from './useBoardMotion';
import { createGame, placePieces, setSpecialTile } from './engine';

test('stack movement produces one arrival and one captured stack effect', () => {
  let game = createGame();
  game = placePieces(game, { team: 0, piece: 0 }, 5);
  game = placePieces(game, { team: 0, piece: 1 }, 5);
  game = placePieces(game, { team: 1, piece: 0 }, 'center');
  game = placePieces(game, { team: 1, piece: 1 }, 'center');
  const next = placePieces(game, { team: 0, piece: 0 }, 'center');
  const effects = boardTransitions(game, next);
  expect(Object.keys(effects.arrivals)).toEqual(['0-center']);
  expect(effects.captures).toHaveLength(1);
  expect(effects.captures[0]).toMatchObject({ team: 1, count: 2, position: 'center' });
  expect(boardTransitions(next, game).captures).toEqual([]);
});

test('returning to reserve is not a capture and initial render has no effects', () => {
  const game = placePieces(createGame(), { team: 0, piece: 0 }, 5);
  expect(boardTransitions(null, game)).toEqual({ arrivals: {}, captures: [] });
  expect(boardTransitions(game, placePieces(game, { team: 0, piece: 0 }, null)).captures).toEqual([]);
});

test('hell animates even a reserve piece and does not replay on undo or first load', () => {
  const game = setSpecialTile(createGame(), 'hell', 5);
  const next = placePieces(game, { team: 0, piece: 0 }, 5);
  expect(boardTransitions(game, next).special).toMatchObject({ kind: 'hell', count: 1, position: 5 });
  expect(boardTransitions(next, game).special).toBeUndefined();
  expect(boardTransitions(null, next).special).toBeUndefined();
});

test('birth animates the chosen reserve piece while the arriving stack keeps its source', () => {
  const game = setSpecialTile(placePieces(createGame(), { team: 0, piece: 0 }, 5), 'birth', 'center');
  const next = placePieces(game, { team: 0, piece: 0 }, 'center', 3);
  expect(boardTransitions(game, next).special).toMatchObject({ kind: 'birth', added: 3, from: 5 });
});
