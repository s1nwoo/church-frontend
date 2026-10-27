import { isBoardPosition } from './boardModel';

// Retain the old key so a saved first-version board can be migrated.
export const STORAGE_KEY = 'bhbc.admin.yut.v1';
export const SYNC_CHANNEL = 'bhbc.admin.yut';
export const HISTORY_LIMIT = 100;
const validPosition = p => p === null || p === 'finished' || isBoardPosition(p);
export function validGame(value) {
  return value?.version === 2 && (value.mode === undefined || ['team', 'individual'].includes(value.mode))
    && Array.isArray(value.teams) && value.teams.length >= 2 && value.teams.length <= (value.mode === 'individual' ? 10 : 4)
    && (value.specials === undefined || (value.specials && ['birth', 'hell'].every(key => value.specials[key] === null || isBoardPosition(value.specials[key]))
      && (value.specials.birth === null || value.specials.birth !== value.specials.hell)))
    && Array.isArray(value.log) && value.log.length <= 60 && value.log.every(line => typeof line === 'string')
    && value.teams.every(t => t && typeof t.name === 'string' && t.name.length <= 12 && /^#[0-9a-f]{6}$/i.test(t.color)
      && Array.isArray(t.pieces) && (value.mode === 'individual' ? t.pieces.length === 1 : t.pieces.length >= 2 && t.pieces.length <= 4)
      && t.pieces.every(p => p && validPosition(p.position)));
}
export const emptySnapshot = () => ({ format: 2, revision: 0, game: null, history: [] });
export function parseSnapshot(text) {
  const value = typeof text === 'string' ? JSON.parse(text) : text;
  if (value?.version === 1 || value?.version === 2) {
    const migrated = { version: 2, ...(value.mode ? { mode: value.mode } : {}), teams: value.teams?.map(t => ({
      name: t.name, color: t.color, pieces: t.pieces?.map(p => ({ position: p.position })),
    })), ...(value.specials ? { specials: value.specials } : {}), log: value.version === 1 ? ['이전 경기의 말 배치를 불러왔습니다.'] : value.log };
    if (validGame(migrated)) return { ...emptySnapshot(), game: migrated };
  }
  if (value?.format === 2 && Number.isSafeInteger(value.revision) && value.revision >= 0 && validGame(value.game)
    && Array.isArray(value.history) && value.history.length <= HISTORY_LIMIT && value.history.every(validGame)) return value;
  throw new Error('Invalid saved board');
}
export function loadGame(storage) {
  try {
    const text = storage.getItem(STORAGE_KEY);
    return { snapshot: text ? parseSnapshot(text) : emptySnapshot(), error: '' };
  } catch {
    return { snapshot: emptySnapshot(), error: '저장된 경기 기록을 읽을 수 없습니다. 관리자 화면에서 경기를 다시 설정해 주세요.' };
  }
}
