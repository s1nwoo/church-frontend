import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import YutPage from './YutPage';
import YutDisplayPage from './YutDisplayPage';
import { createGame, placePieces } from '../../features/yut/engine';
import { STORAGE_KEY, SYNC_CHANNEL } from '../../features/yut/storage';
const page = () => render(<MemoryRouter><YutPage /></MemoryRouter>);
const snapshot = () => JSON.parse(localStorage.getItem(STORAGE_KEY));
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test('setup offers ten colors per team and saves the chosen color across reloads', () => {
  const mounted = page();
  expect(within(screen.getByRole('group', { name: '1팀 말 색상' })).getAllByRole('radio')).toHaveLength(10);
  fireEvent.click(screen.getByRole('radio', { name: '1팀 청록' }));
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  expect(snapshot().game.teams[0].color).toBe('#35d5db');
  mounted.unmount(); page();
  fireEvent.click(screen.getByRole('button', { name: '새 경기' }));
  expect(screen.getByRole('radio', { name: '1팀 청록' })).toBeChecked();
});

test('team colors cannot duplicate and become available when released', () => {
  page();
  expect(screen.getByRole('radio', { name: '2팀 파랑' })).toBeDisabled();
  fireEvent.click(screen.getByRole('radio', { name: '1팀 노랑' }));
  expect(screen.getByRole('radio', { name: '2팀 노랑' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: '2팀 파랑' })).toBeEnabled();
  fireEvent.click(screen.getByRole('radio', { name: '2팀 초록' }));
  fireEvent.change(screen.getByRole('combobox', { name: '참가 팀' }), { target: { value: '4' } });
  const checked = screen.getAllByRole('radio').filter(radio => radio.checked && radio.name.startsWith('team-color-')).map(radio => radio.getAttribute('aria-label').split(' ')[1]);
  expect(new Set(checked).size).toBe(4);
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  expect(new Set(snapshot().game.teams.map(team => team.color)).size).toBe(4);
});

test('individual mode supports six named players, capture, undo and saved reload', () => {
  const mounted = page();
  fireEvent.click(screen.getByRole('radio', { name: '개인전', exact: true }));
  fireEvent.change(screen.getByRole('combobox', { name: '참가 인원' }), { target: { value: '6' } });
  fireEvent.change(screen.getByRole('textbox', { name: '1번 참가자 이름' }), { target: { value: '김철수' } });
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  expect(snapshot().game.mode).toBe('individual');
  expect(snapshot().game.teams).toHaveLength(6);
  expect(snapshot().game.teams.every(t => t.pieces.length === 1)).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '김철수 1번 말 · 대기석' }));
  fireEvent.click(screen.getByRole('button', { name: '중앙에 놓기', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: '6번 참가자 1번 말 · 대기석' }));
  fireEvent.click(screen.getByRole('button', { name: /중앙에 놓기 · 김철수/ }));
  expect(snapshot().game.teams[0].pieces[0].position).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '↶ 말 배치 되돌리기' }));
  expect(snapshot().game.teams[0].pieces[0].position).toBe('center');
  mounted.unmount(); page();
  expect(screen.getByRole('button', { name: '김철수 1번 말', exact: true })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '새 경기' }));
  expect(screen.getByRole('radio', { name: '개인전', exact: true })).toBeChecked();
  expect(screen.getByRole('combobox', { name: '참가 인원' })).toHaveValue('6');
});

test('manual placement has no throw controls and undo survives reload', () => {
  const mounted = page();
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  expect(screen.queryByText('던진 결과 입력')).not.toBeInTheDocument();
  expect(screen.queryByText('함께 웃고, 함께 응원해요')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '사랑팀 1번 말 · 대기석' }));
  fireEvent.click(screen.getByRole('button', { name: '중앙에 놓기', exact: true }));
  expect(snapshot().game.teams[0].pieces[0].position).toBe('center');
  expect(snapshot().history).toHaveLength(1);
  mounted.unmount(); page();
  fireEvent.click(screen.getByRole('button', { name: '↶ 말 배치 되돌리기' }));
  expect(snapshot().game.teams[0].pieces[0].position).toBeNull();
  expect(screen.getByRole('button', { name: '↶ 말 배치 되돌리기' })).toBeDisabled();
});
test('selection changes do not enter undo history; finishing is one placement', () => {
  page(); fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  fireEvent.click(screen.getByRole('button', { name: '사랑팀 1번 말 · 대기석' }));
  fireEvent.click(screen.getByRole('button', { name: '기쁨팀 2번 말 · 대기석' }));
  expect(snapshot().history).toHaveLength(0);
  const dataTransfer = { setData: jest.fn() };
  fireEvent.dragStart(screen.getByRole('button', { name: '기쁨팀 2번 말 · 대기석' }), { dataTransfer });
  fireEvent.drop(screen.getByRole('region', { name: '기쁨팀 완주 공간' }), { dataTransfer });
  expect(snapshot().game.teams[1].pieces[1].position).toBe('finished');
  expect(snapshot().history).toHaveLength(1);
});
test('dragging to finish and back replaces unlocking and supports undo', () => {
  page(); fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  const dataTransfer = { setData: jest.fn(), effectAllowed: '', dropEffect: '' };
  fireEvent.dragStart(screen.getByRole('button', { name: '사랑팀 1번 말 · 대기석' }), { dataTransfer });
  fireEvent.drop(screen.getByRole('region', { name: '기쁨팀 완주 공간' }), { dataTransfer });
  expect(snapshot().game.teams[0].pieces[0].position).toBeNull();
  fireEvent.drop(screen.getByRole('region', { name: '사랑팀 완주 공간' }), { dataTransfer });
  const finished = screen.getByRole('button', { name: /사랑팀 1번 말 · 완주/ });
  expect(finished).toBeDisabled();
  expect(screen.queryByText('완주 말 수정')).not.toBeInTheDocument();
  fireEvent.dragStart(screen.getByRole('img', { name: '사랑팀 1번 말 완주' }), { dataTransfer });
  fireEvent.drop(screen.getByRole('button', { name: '중앙에 놓기', exact: true }), { dataTransfer });
  expect(snapshot().game.teams[0].pieces[0].position).toBe('center');
  fireEvent.click(screen.getByRole('button', { name: '↶ 말 배치 되돌리기' }));
  expect(screen.getByRole('button', { name: /사랑팀 1번 말 · 완주/ })).toBeDisabled();
});

test('undo capture restores both the moving piece and captured stack', () => {
  let game = createGame();
  game = placePieces(game, { team: 1, piece: 0 }, 5);
  game = placePieces(game, { team: 1, piece: 1 }, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ format: 2, revision: 1, game, history: [] }));
  page(); fireEvent.click(screen.getByRole('button', { name: '사랑팀 1번 말 · 대기석' }));
  fireEvent.click(screen.getByRole('button', { name: /오른쪽 위 모서리에 놓기 · 기쁨팀/ }));
  expect(snapshot().game.teams[1].pieces[0].position).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '↶ 말 배치 되돌리기' }));
  expect(snapshot().game).toEqual(game);
});
test('special markers drag onto the board and birth effects undo as one placement', () => {
  page(); fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  const dataTransfer = { setData: jest.fn() };
  expect(screen.queryByText('업힌 말 함께 옮기기')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '완주로 보내기' })).not.toBeInTheDocument();
  fireEvent.dragStart(screen.getByRole('img', { name: '한 명 더! 발판 표식' }), { dataTransfer });
  fireEvent.drop(screen.getByRole('button', { name: '중앙에 놓기', exact: true }), { dataTransfer });
  expect(snapshot().game.specials.birth).toBe('center');
  fireEvent.click(screen.getByRole('button', { name: '사랑팀 1번 말 · 대기석' }));
  fireEvent.click(screen.getByRole('button', { name: '중앙에 놓기', exact: true }));
  expect(screen.getByRole('dialog', { name: '한 명 더! · 합류할 말을 골라 주세요' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '1번 말 합류' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '2번 말 합류' }));
  expect(snapshot().game.teams[0].pieces.slice(0, 2).map(p => p.position)).toEqual(['center', 'center']);
  fireEvent.click(screen.getByRole('button', { name: '↶ 말 배치 되돌리기' }));
  expect(snapshot().game.teams[0].pieces.every(p => p.position === null)).toBe(true);
  expect(snapshot().game.specials.birth).toBe('center');
  const before = localStorage.getItem(STORAGE_KEY);
  fireEvent.click(screen.getByRole('button', { name: '사랑팀 1번 말 · 대기석' }));
  fireEvent.click(screen.getByRole('button', { name: '중앙에 놓기', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: '이동 취소' }));
  expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  fireEvent.click(screen.getByRole('button', { name: '한 명 더! 발판 해제' }));
  expect(snapshot().game.specials.birth).toBeNull();
});

test('new game can be cancelled; popup blocker exposes a direct display link', () => {
  jest.spyOn(window, 'open').mockReturnValue(null);
  page(); fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  const saved = localStorage.getItem(STORAGE_KEY);
  fireEvent.click(screen.getByRole('button', { name: '새 경기' }));
  fireEvent.click(screen.getByRole('button', { name: '현재 경기로 돌아가기' }));
  expect(localStorage.getItem(STORAGE_KEY)).toBe(saved);
  fireEvent.click(screen.getByRole('button', { name: '빔 화면 열기 ↗' }));
  expect(window.open).toHaveBeenCalledWith('/admin/yut/display', 'bhbc-yut-projector', expect.stringContaining('popup=yes'));
  expect(screen.getByRole('link', { name: '빔 화면 직접 열기' })).toHaveAttribute('href', '/admin/yut/display');
});
test('projector receives storage updates and never writes saved data or shows editing controls', () => {
  const write = jest.spyOn(Storage.prototype, 'setItem');
  render(<YutDisplayPage />);
  expect(screen.getByText('경기 준비 중')).toBeInTheDocument();
  const game = placePieces(createGame(), { team: 0, piece: 0 }, 'center');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY,
    newValue: JSON.stringify({ format: 2, revision: 1, game, history: [] }) })));
  expect(screen.getByRole('img', { name: '사랑팀 1번 말' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /놓기|되돌리기|새 경기/ })).not.toBeInTheDocument();
  expect(write).not.toHaveBeenCalled();
});
test('broadcast synchronizes placements and undo to a separate read-only view', () => {
  const original = global.BroadcastChannel;
  const channels = [];
  global.BroadcastChannel = class {
    constructor(name) { this.name = name; channels.push(this); }
    postMessage(data) { channels.filter(c => c !== this && c.name === this.name).forEach(c => c.onmessage?.({ data })); }
    close() { channels.splice(channels.indexOf(this), 1); }
  };
  try {
    const manager = page(); const display = render(<YutDisplayPage />);
    expect(within(display.container).getByRole('heading', { name: '윷놀이 경기 설정' })).toBeInTheDocument();
    expect(within(display.container).getByRole('textbox', { name: '1팀 이름' })).toBeDisabled();
    fireEvent.click(within(manager.container).getByRole('radio', { name: '1팀 청록' }));
    expect(within(display.container).getByRole('radio', { name: '1팀 청록' })).toBeChecked();
    expect(display.container.querySelectorAll('.yut-color-taken')).toHaveLength(0);
    expect(manager.container.querySelectorAll('.yut-color-taken').length).toBeGreaterThan(0);
    expect(within(display.container).queryByRole('button', { name: '경기 시작' })).not.toBeInTheDocument();
    fireEvent.click(within(manager.container).getByRole('button', { name: '경기 시작' }));
    expect(within(display.container).queryByRole('heading', { name: '윷놀이 경기 설정' })).not.toBeInTheDocument();
    fireEvent.click(within(manager.container).getByRole('button', { name: '사랑팀 1번 말 · 대기석' }));
    fireEvent.click(within(manager.container).getByRole('button', { name: '중앙에 놓기', exact: true }));
    expect(within(display.container).getByRole('img', { name: '사랑팀 1번 말' })).toBeInTheDocument();
    fireEvent.click(within(manager.container).getByRole('button', { name: '사랑팀 1번 말', exact: true }));
    expect(within(display.container).getByRole('img', { name: '사랑팀 1번 말' })).toHaveClass('selected');
    expect(snapshot().history).toHaveLength(1);
    fireEvent.click(within(manager.container).getByRole('button', { name: '선택 취소' }));
    expect(within(display.container).getByRole('img', { name: '사랑팀 1번 말' })).not.toHaveClass('selected');
    fireEvent.click(within(manager.container).getByRole('button', { name: '↶ 말 배치 되돌리기' }));
    expect(within(display.container).queryByRole('img', { name: '사랑팀 1번 말' })).not.toBeInTheDocument();
    fireEvent.click(within(manager.container).getByRole('button', { name: '새 경기' }));
    expect(within(display.container).getByRole('heading', { name: '윷놀이 경기 설정' })).toBeInTheDocument();
    fireEvent.click(within(manager.container).getByRole('button', { name: '현재 경기로 돌아가기' }));
    expect(within(display.container).queryByRole('heading', { name: '윷놀이 경기 설정' })).not.toBeInTheDocument();
    expect(channels.every(c => c.name === SYNC_CHANNEL)).toBe(true);
    manager.unmount(); display.unmount();
    expect(channels).toHaveLength(0);
  } finally { global.BroadcastChannel = original; }
});
test('failed storage warns but manual board still operates', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  page(); fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  expect(screen.getByRole('alert')).toHaveTextContent('자동 저장에 실패');
  fireEvent.click(screen.getByRole('button', { name: '사랑팀 1번 말 · 대기석' }));
  fireEvent.click(screen.getByRole('button', { name: '중앙에 놓기', exact: true }));
  expect(screen.getByRole('button', { name: '사랑팀 1번 말', exact: true })).toBeInTheDocument();
});
