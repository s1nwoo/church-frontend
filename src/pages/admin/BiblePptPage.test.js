import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import BiblePptPage from './BiblePptPage';
import BibleBroadcastPage from './BibleBroadcastPage';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
// jsdom에는 PointerEvent가 없어 마우스 좌표·버튼이 전달되지 않으므로 테스트에서만 대신 만든다.
beforeAll(() => {
  if (!window.PointerEvent) window.PointerEvent = class extends MouseEvent {
    constructor(type, init = {}) { super(type, init); this.pointerId = init.pointerId; }
  };
});
const defaultStyle = { titleFontSize: 32, bodyFontSize: 40,
  title: { x: 10, y: 10, width: 600, height: 50 }, body: { x: 10, y: 70, width: 600, height: 300 } };
const verses = [{ title: '창1:1', body: '1 태초에 하나님이' }, { title: '창1:2', body: '2 땅이 혼돈하고' }];
const STYLE_KEY = 'banghwa-bible-ppt-style-v1';
const SLIDES_KEY = 'banghwa-bible-ppt-slides-v1';
// 성경 PPT 만들기 메뉴
function page(user = { role: 'ADMIN' }) {
  return render(<MemoryRouter><AuthContext.Provider value={{ user }}><BiblePptPage /></AuthContext.Provider></MemoryRouter>);
}
// 성경 송출 메뉴
function broadcastPage(user = { role: 'ADMIN' }) {
  return render(<MemoryRouter><AuthContext.Provider value={{ user }}><BibleBroadcastPage /></AuthContext.Provider></MemoryRouter>);
}
// 저장된 목록에서 id를 뺀 내용
const storedSlides = () => JSON.parse(localStorage.getItem(SLIDES_KEY)).map(({ id, ...rest }) => rest);
// 구절을 입력하고 Enter(폼 제출)로 목록에 추가한다.
async function add(value) {
  const input = await screen.findByLabelText('성경 구절');
  fireEvent.change(input, { target: { value } }); fireEvent.submit(input.closest('form'));
}
async function enter(value = '창1:1-2') {
  await add(value);
  await waitFor(() => expect(screen.getByRole('button', { name: 'PPT 저장…' })).toBeEnabled());
  await waitFor(() => expect(screen.getByLabelText('성경 구절')).toHaveValue(''));
}
// 성경 송출 화면에는 PPT 저장이 없으므로 입력칸이 비워지는 것으로 추가가 끝났는지 본다.
async function addLive(value = '창1:1-2') {
  const before = document.querySelectorAll('.bp-list li strong').length;
  await add(value);
  await waitFor(() => expect(document.querySelectorAll('.bp-list li strong').length).toBeGreaterThan(before));
  await waitFor(() => expect(screen.getByLabelText('성경 구절')).toHaveValue(''));
}
// 목록의 n번째 카드(1부터). 화면에는 번호를 표시하지 않으므로 순서로 찾고 제목을 확인한다.
function card(n, title, live = false) {
  const button = document.querySelectorAll('.bp-list li')[n - 1]?.querySelector('.bp-slide-main');
  expect(button).toBeTruthy();
  expect(button.querySelector('strong')).toHaveTextContent(title);
  expect(button).not.toHaveTextContent(/슬라이드 \d/);
  // 송출 중인 카드는 ‘송출 중’ 글자 없이 초록 배경(is-live)과 aria-current로만 표시한다.
  expect(button).not.toHaveTextContent('송출 중');
  if (live) {
    expect(button.closest('li')).toHaveClass('is-live');
    expect(button.closest('li')).toHaveAttribute('aria-current', 'true');
  }
  return button;
}
const titles = () => [...document.querySelectorAll('.bp-list li strong')].map(e => e.textContent.trim());
function openEditor() { fireEvent.click(screen.getByText('본문 편집 · 위치와 상자 크기 직접 입력')); }
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('accessToken', 'admin-token');
  delete window.showSaveFilePicker;
  URL.createObjectURL = jest.fn(() => 'blob:preview'); URL.revokeObjectURL = jest.fn();
  axios.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/ranges') ? { 1: [1, 2, 3], 2: [1, 2] } : {
    books: [{ name: '창세기', abbreviation: '창' }, { name: '출애굽기', abbreviation: '출' }], width: 720, height: 405, defaultStyle
  } }));
  axios.post.mockImplementation(url => Promise.resolve({ data: url.endsWith('/slides') ? verses : new Blob(['test']) }));
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test('requires an administrator before fetching Bible data', () => {
  page({ role: 'USER' });
  expect(screen.getByRole('link', { name: '로그인하기' })).toBeInTheDocument(); expect(axios.get).not.toHaveBeenCalled();
});
test('성경 PPT 만들기 shows search, verse input, floating list, preview and save, but no projector controls', async () => {
  page(); await screen.findByLabelText('성경 검색');
  for (const name of ['성경 PPT 만들기', '슬라이드 목록 0장', '성경 검색', '구절 입력', '실제 미리보기']) {
    expect(screen.getByRole('heading', { name })).toBeVisible();
  }
  // 구절 입력은 성경 검색 아래(왼쪽 열)에 있고, 슬라이드 목록은 떠 있는 위젯이다. 빔 화면 송출은 별도 메뉴(성경 송출)에 있다.
  expect(screen.getByLabelText('성경 구절').closest('.bp-input-column')).toBeTruthy();
  expect(screen.getByRole('heading', { name: '슬라이드 목록 0장' }).closest('.bp-widget')).toBeTruthy();
  expect(screen.queryByRole('heading', { name: /빔 화면 송출/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '빔 화면 열기' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('줄 수 제한')).toHaveValue(null);
  expect(screen.getByRole('slider', { name: '제목 크기' })).toBeVisible();
  expect(screen.getByText('말씀 슬라이드 미리보기')).toBeVisible();
  // 전체 설정은 자동 저장되므로 ‘현재 설정 저장’ 버튼은 없다.
  expect(screen.queryByRole('button', { name: '현재 설정 저장' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'PPT 저장…' })).toBeDisabled();
});
test('성경 송출 shows only on-air tools: list on top, projector panel with verse input at the bottom', async () => {
  broadcastPage(); await addLive();
  expect(screen.getByRole('main')).toHaveClass('is-compact', 'is-broadcast');
  expect(screen.getByRole('heading', { name: /빔 화면 송출/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '빔 화면 열기' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '구절 입력' }).closest('.bp-live')).toBeTruthy();
  for (const name of ['성경 검색', '실제 미리보기']) expect(screen.queryByRole('heading', { name })).not.toBeInTheDocument();
  for (const name of ['PPT 저장…', '합치기 풀기', '편집 중인 슬라이드 송출']) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('줄 수 제한')).not.toBeInTheDocument();
  // 새 탭에 로그인(sessionStorage)이 복사되도록 window.open으로 연다.
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  fireEvent.click(screen.getByRole('button', { name: '성경 PPT 만들기 (새 탭)' }));
  expect(openSpy).toHaveBeenCalledWith('/admin/bible-ppt', '_blank');
  // 알림은 아래 송출 패널 안에 보이고, 실제 미리보기가 없으므로 편집용 미리보기를 서버에 요청하지 않는다.
  expect(screen.getByText(/맨 뒤에 추가했습니다/).closest('.bp-live')).toBeTruthy();
  fireEvent.click(card(2, '창1:2'));
  await new Promise(r => setTimeout(r, 350));
  expect(axios.post.mock.calls.filter(([url, , opts]) => url.endsWith('/preview') && !opts?.params)).toHaveLength(0);
});
test('the two menus share the slide list and the font settings, and another tab’s changes show up right away', async () => {
  const ppt = page(); await enter();
  // 글자 크기를 바꾸면 자동 저장된다.
  fireEvent.change(screen.getByRole('slider', { name: '본문 크기' }), { target: { value: '44' } });
  expect(JSON.parse(localStorage.getItem(STYLE_KEY))).toMatchObject({ bodyFontSize: 44 });
  ppt.unmount();
  broadcastPage();
  await waitFor(() => expect(titles()).toEqual(['창1:1', '창1:2']));
  // 다른 탭(성경 PPT 만들기)에서 구절을 추가하면 송출 화면 목록에도 바로 나타난다.
  const other = [...JSON.parse(localStorage.getItem(SLIDES_KEY)), { id: 999, title: '요3:16', body: '16 하나님이 세상을' }];
  act(() => { window.dispatchEvent(new StorageEvent('storage', { key: SLIDES_KEY, newValue: JSON.stringify(other) })); });
  expect(titles()).toEqual(['창1:1', '창1:2', '요3:16']);
});
test('searches books and adds an actual verse range from the selection dialog', async () => {
  page(); fireEvent.change(await screen.findByLabelText('성경 검색'), { target: { value: '창' } });
  expect(screen.queryByRole('option', { name: '출애굽기 (출)' })).not.toBeInTheDocument();
  fireEvent.doubleClick(screen.getByRole('option', { name: '창세기 (창)' }));
  const dialog = await screen.findByRole('dialog');
  const start = await within(dialog).findByLabelText('시작 절');
  fireEvent.change(start, { target: { value: '2' } });
  expect(within(within(dialog).getByLabelText('끝 절')).queryByRole('option', { name: '1절' })).not.toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText('끝 절'), { target: { value: '3' } });
  fireEvent.click(within(dialog).getByRole('button', { name: '구절 추가' }));
  // 고른 구절은 입력칸을 거치지 않고 바로 목록에 추가된다.
  await waitFor(() => expect(screen.getByLabelText('2번 슬라이드 선택')).toBeEnabled());
  expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/slides', { reference: '창1:2-3', lineLimit: 0 }, expect.anything());
});
test('keeps adding entered verses to the list instead of replacing it, with the line limit applied per add', async () => {
  axios.post.mockImplementation((url, body) => Promise.resolve({ data: !url.endsWith('/slides') ? new Blob(['test'])
    : body.reference === '요3:16' ? [{ title: '요3:16', body: '16 하나님이 세상을' }] : verses }));
  page(); await enter(); openEditor();
  expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/slides', { reference: '창1:1-2', lineLimit: 0 },
    expect.objectContaining({ headers: { Authorization: 'Bearer admin-token' } }));
  fireEvent.change(screen.getByLabelText('본문'), { target: { value: '1 편집 유지' } });
  fireEvent.change(screen.getByLabelText('줄 수 제한'), { target: { value: '3' } });
  await enter('요3:16');
  expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/slides', { reference: '요3:16', lineLimit: 3 }, expect.anything());
  expect(screen.getByRole('heading', { name: '슬라이드 목록 3장' })).toBeInTheDocument();
  // 위젯 카드는 제목만 보여 주고, 편집한 본문은 마우스를 올리면 바로 뜨는 툴팁으로만 보인다.
  expect(card(1, '창1:1')).toHaveTextContent(/^창1:1$/);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.pointerEnter(card(1, '창1:1').closest('li'));
  expect(screen.getByRole('tooltip')).toHaveTextContent('1 편집 유지');
  fireEvent.pointerLeave(card(1, '창1:1').closest('li'));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  card(3, '요3:16');
  expect(screen.getByText(/요3:16 → 슬라이드 1장을 맨 뒤에 추가했습니다/)).toBeInTheDocument();
});
test('saves the list in this browser and restores it after reloading the page', async () => {
  const first = page(); await enter();
  expect(storedSlides()).toEqual(verses);
  expect(JSON.parse(localStorage.getItem(SLIDES_KEY)).every(s => Number.isInteger(s.id))).toBe(true);
  first.unmount();
  page();
  await waitFor(() => card(2, '창1:2'));
  expect(screen.getByText('이전에 작업하던 슬라이드 2장을 불러왔습니다.')).toBeInTheDocument();
});
test('delete mode removes clicked cards, undo restores them all at once, and the list can be cleared after confirmation', async () => {
  page(); await enter(); await enter('창1:1-2');
  let clock = 1000;
  jest.spyOn(Date, 'now').mockImplementation(() => clock);
  fireEvent.click(screen.getByRole('button', { name: '✕ 삭제 모드' }));
  expect(screen.getByRole('button', { name: '✕ 삭제 모드' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText(/삭제 모드: 지울 카드를 누르세요/)).toBeInTheDocument();
  fireEvent.click(card(1, '창1:1'));
  // 0.35초 안에 다시 누른 클릭(빠른 두 번 클릭)은 무시해 다음 카드까지 지워지지 않는다.
  fireEvent.click(card(1, '창1:2'));
  expect(titles()).toEqual(['창1:2', '창1:1', '창1:2']);
  clock += 1000; fireEvent.click(card(2, '창1:1'));
  expect(titles()).toEqual(['창1:2', '창1:2']);
  expect(screen.getByText('2장을 지웠습니다.')).toBeInTheDocument();
  // 되돌리기 한 번으로 삭제 모드에서 지운 2장이 모두 돌아온다.
  fireEvent.click(screen.getByRole('button', { name: '되돌리기' }));
  expect(titles()).toEqual(['창1:1', '창1:2', '창1:1', '창1:2']);
  // Esc로 삭제 모드를 끝내면 카드를 눌러도 지워지지 않는다.
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByText(/삭제 모드: 지울 카드를 누르세요/)).not.toBeInTheDocument();
  clock += 1000; fireEvent.click(card(1, '창1:1'));
  expect(titles()).toHaveLength(4);
  clock += 1000; fireEvent.click(screen.getByRole('button', { name: '✕ 삭제 모드' }));
  fireEvent.click(card(1, '창1:1')); clock += 1000; fireEvent.click(card(1, '창1:2'));
  expect(screen.getByRole('heading', { name: '슬라이드 목록 2장' })).toBeInTheDocument();
  window.confirm = jest.fn(() => false);
  fireEvent.click(screen.getByRole('button', { name: '비우기' }));
  expect(screen.getByRole('heading', { name: '슬라이드 목록 2장' })).toBeInTheDocument();
  window.confirm = jest.fn(() => true);
  fireEvent.click(screen.getByRole('button', { name: '비우기' }));
  expect(window.confirm).toHaveBeenCalledWith('슬라이드 2장을 모두 지울까요?');
  expect(screen.getByRole('heading', { name: '슬라이드 목록 0장' })).toBeInTheDocument();
  expect(localStorage.getItem('banghwa-bible-ppt-slides-v1')).toBeNull();
  // 비운 목록도 되돌릴 수 있다.
  fireEvent.click(screen.getByRole('button', { name: '되돌리기' }));
  expect(screen.getByRole('heading', { name: '슬라이드 목록 2장' })).toBeInTheDocument();
});
test('cards have no ✂·✕ icons; cut mode opens the split dialog for the clicked card and splits it', async () => {
  page(); await enter();
  expect(screen.queryByRole('button', { name: /슬라이드 삭제|슬라이드 나누기/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '✂ 나누기 모드' }));
  expect(screen.getByText(/나누기 모드: 나눌 구절 카드를 누르세요/)).toBeInTheDocument();
  fireEvent.click(card(1, '창1:1'));
  const dialog = screen.getByRole('dialog', { name: '창1:1 나누기' });
  // 보통 클릭과 달리 편집할 슬라이드 선택은 바뀌지 않고 나누기 창만 뜬다.
  fireEvent.click(within(dialog).getByRole('button', { name: '‘태초에’ 뒤에서 자르기' }));
  fireEvent.click(within(dialog).getByRole('button', { name: '2장으로 나누기' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(titles()).toEqual(['창1:1', '창1:1', '창1:2']);
  expect(storedSlides().map(s => s.body)).toEqual(['1 태초에', '하나님이', '2 땅이 혼돈하고']);
  // 끝내기 버튼으로 모드를 끝낸다.
  fireEvent.click(screen.getByRole('button', { name: '끝내기 (Esc)' }));
  expect(screen.getByRole('button', { name: '✂ 나누기 모드' })).toHaveAttribute('aria-pressed', 'false');
});
test('reorders slides by dragging a card and drops the click that ends the drag', async () => {
  axios.post.mockImplementation((url, body) => Promise.resolve({ data: !url.endsWith('/slides') ? new Blob(['test'])
    : body.reference === '요3:16' ? [{ title: '요3:16', body: '16 하나님이 세상을' }] : verses }));
  page(); await enter(); await enter('요3:16');
  expect(titles()).toEqual(['창1:1', '창1:2', '요3:16']);
  fireEvent.click(card(2, '창1:2'));
  const rows = () => document.querySelectorAll('.bp-list li');
  // jsdom에는 화면 배치가 없으므로 ‘마우스 아래 카드’를 첫 번째 카드로, 그 카드의 위쪽 절반으로 정한다.
  document.elementFromPoint = jest.fn(() => rows()[0]);
  jest.spyOn(rows()[0], 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 40, height: 40, left: 0, right: 300, width: 300 });
  jest.spyOn(rows()[2], 'getBoundingClientRect').mockReturnValue({ top: 80, bottom: 120, height: 40, left: 5, right: 305, width: 300 });
  const third = rows()[2].querySelector('.bp-slide-main');
  fireEvent.pointerDown(third, { button: 0, clientX: 10, clientY: 100 });
  expect(document.querySelector('.bp-drag-ghost')).toBeNull();
  fireEvent.pointerMove(window, { clientX: 10, clientY: 60 });
  expect(rows()[2]).toHaveClass('is-dragging');
  // 잡은 카드가 마우스를 따라온다. 세 번째 카드(top 80)의 위에서 20px 아래를 잡았으므로 카드 위쪽은 늘 마우스보다 20px 위다.
  const ghost = document.querySelector('.bp-drag-ghost');
  expect(ghost).toHaveTextContent('요3:16');
  expect([ghost.style.left, ghost.style.top]).toEqual(['5px', '40px']);
  fireEvent.pointerMove(window, { clientX: 10, clientY: 10 });
  expect([document.querySelector('.bp-drag-ghost').style.left, document.querySelector('.bp-drag-ghost').style.top]).toEqual(['5px', '-10px']);
  expect(rows()[0]).toHaveClass('drop-before');
  fireEvent.pointerUp(window, { clientX: 10, clientY: 10 });
  expect(document.querySelector('.bp-drag-ghost')).toBeNull();
  fireEvent.click(third);
  expect(titles()).toEqual(['요3:16', '창1:1', '창1:2']);
  // 끌기를 끝낸 클릭은 편집 선택으로 처리되지 않는다(편집 중인 슬라이드는 그대로 창1:2, 순서만 3번째로).
  expect(card(3, '창1:2')).toHaveAttribute('aria-pressed', 'true');
  expect(card(1, '요3:16')).toHaveAttribute('aria-pressed', 'false');
  // 조금만 움직이면 끌기가 아니라 보통 클릭이다.
  fireEvent.pointerDown(third, { button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(window, { clientX: 12, clientY: 12 });
  fireEvent.pointerUp(window);
  expect(titles()).toEqual(['요3:16', '창1:1', '창1:2']);
});
test('when the widget is wide enough for several columns, dragging decides the spot by left/right half', async () => {
  axios.post.mockImplementation((url, body) => Promise.resolve({ data: !url.endsWith('/slides') ? new Blob(['test'])
    : body.reference === '요3:16' ? [{ title: '요3:16', body: '16 하나님이 세상을' }] : verses }));
  page(); await enter(); await enter('요3:16');
  const list = document.querySelector('.bp-list ol'), rows = () => document.querySelectorAll('.bp-list li');
  list.style.gridTemplateColumns = '200px 200px 200px';   // 위젯을 넓혀 3칸이 된 상태
  document.elementFromPoint = jest.fn(() => rows()[0]);
  jest.spyOn(rows()[0], 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 40, height: 40, left: 0, right: 200, width: 200 });
  const third = rows()[2].querySelector('.bp-slide-main');
  fireEvent.pointerDown(third, { button: 0, clientX: 450, clientY: 20 });
  // 첫 카드의 오른쪽 절반 위(세로 위치는 위쪽 절반이어도) → 첫 카드 ‘뒤’, 세로 표시선
  fireEvent.pointerMove(window, { clientX: 150, clientY: 5 });
  expect(rows()[0]).toHaveClass('drop-after', 'drop-x');
  fireEvent.pointerUp(window, { clientX: 150, clientY: 5 });
  expect(titles()).toEqual(['창1:1', '요3:16', '창1:2']);
});
test('thumbnail view shows real slide images loaded at small size, and remembers the view and size', async () => {
  const first = page(); await enter();
  expect(document.querySelector('.bp-thumb')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '썸네일' }));
  expect(screen.getByRole('button', { name: '썸네일' })).toHaveAttribute('aria-pressed', 'true');
  await waitFor(() => expect(document.querySelectorAll('.bp-thumb img')).toHaveLength(2));
  for (const verse of verses) {
    expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/preview', expect.objectContaining({ title: verse.title, body: verse.body }),
      expect.objectContaining({ params: { width: 400 }, responseType: 'blob' }));
  }
  // 같은 내용은 다시 받지 않는다.
  const thumbCalls = () => axios.post.mock.calls.filter(([url, , opts]) => url.endsWith('/preview') && opts?.params?.width === 400).length;
  expect(thumbCalls()).toBe(2);
  fireEvent.click(screen.getByRole('button', { name: '목록 접기' })); fireEvent.click(screen.getByRole('button', { name: '목록 펼치기' }));
  await waitFor(() => expect(document.querySelectorAll('.bp-thumb img')).toHaveLength(2));
  expect(thumbCalls()).toBe(2);
  // 썸네일을 누르면 편집할 슬라이드가 바뀌고, 썸네일 보기에서는 툴팁을 띄우지 않는다.
  fireEvent.click(document.querySelectorAll('.bp-thumb')[1]);
  expect(card(2, '창1:2')).toHaveAttribute('aria-pressed', 'true');
  fireEvent.pointerEnter(card(1, '창1:1').closest('li'));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  // 크기 슬라이더는 카드 최소 폭을 바꾼다(5단계 = 360px).
  fireEvent.change(screen.getByRole('slider', { name: '썸네일 크기' }), { target: { value: '5' } });
  expect(document.querySelector('.bp-list ol').style.getPropertyValue('--bp-card-min')).toBe('360px');
  expect(JSON.parse(localStorage.getItem('banghwa-bible-ppt-widget-v1'))).toMatchObject({ view: 'thumb', thumb: 5 });
  first.unmount(); page();
  await waitFor(() => expect(document.querySelectorAll('.bp-thumb')).toHaveLength(2));
  fireEvent.click(screen.getByRole('button', { name: '제목' }));
  expect(document.querySelector('.bp-thumb')).toBeNull();
  expect(screen.queryByRole('slider', { name: '썸네일 크기' })).not.toBeInTheDocument();
});
test('the slide list widget can be collapsed and remembers it', async () => {
  const first = page(); await enter();
  fireEvent.click(screen.getByRole('button', { name: '목록 접기' }));
  expect(document.querySelector('.bp-list ol')).toBeNull();
  expect(JSON.parse(localStorage.getItem('banghwa-bible-ppt-widget-v1'))).toMatchObject({ collapsed: true });
  first.unmount(); page();
  fireEvent.click(await screen.findByRole('button', { name: '목록 펼치기' }));
  expect(titles()).toEqual(['창1:1', '창1:2']);
});
test('merges contiguous references, splits, edits, names and downloads the deck', async () => {
  page(); await enter(); openEditor();
  fireEvent.click(screen.getByLabelText('1번 슬라이드 선택')); fireEvent.click(screen.getByLabelText('2번 슬라이드 선택'));
  fireEvent.click(screen.getByRole('button', { name: '합치기' }));
  expect(screen.getByLabelText('슬라이드 제목')).toHaveValue('창1:1-2');
  expect(screen.getByLabelText('본문')).toHaveValue('1 태초에 하나님이\n2 땅이 혼돈하고');
  fireEvent.click(screen.getByRole('button', { name: '합치기 풀기' }));
  expect(screen.getByLabelText('2번 슬라이드 선택')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('본문'), { target: { value: '1 편집한 본문' } });
  fireEvent.change(screen.getByLabelText('저장할 파일명'), { target: { value: '주일봉독' } });
  fireEvent.click(screen.getByRole('button', { name: 'PPT 저장…' }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/download', {
    slides: [{ ...verses[0], body: '1 편집한 본문', style: defaultStyle }, { ...verses[1], style: defaultStyle }]
  }, expect.objectContaining({ responseType: 'blob' })));
  await screen.findByText(/PPT 파일을 저장했습니다/);
  expect(HTMLAnchorElement.prototype.click.mock.instances[0].download).toBe('주일봉독.pptx');
  expect(JSON.parse(localStorage.getItem(STYLE_KEY))).toEqual(defaultStyle);
});
test('supports Shift and Ctrl slide selection and per-slide font sizes', async () => {
  page(); await enter();
  fireEvent.click(card(1, '창1:1'));
  fireEvent.click(card(2, '창1:2'), { shiftKey: true });
  expect(screen.getByRole('button', { name: '합치기' })).toBeEnabled();
  fireEvent.click(card(1, '창1:1'), { ctrlKey: true });
  expect(screen.getByLabelText('1번 슬라이드 선택')).not.toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: '이 슬라이드에만 적용' }));
  fireEvent.change(screen.getByRole('slider', { name: '본문 크기' }), { target: { value: '55' } });
  fireEvent.click(screen.getByRole('button', { name: 'PPT 저장…' }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/download', {
    slides: [{ ...verses[0], style: { ...defaultStyle, bodyFontSize: 55 } }, { ...verses[1], style: defaultStyle }]
  }, expect.anything()));
});
test('resizes text boxes in the preview with the mouse handles, keeping the opposite edge fixed', async () => {
  // 미리보기 영역을 720×405px로 두어 1px = 1pt가 되게 한다.
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 720, height: 405, right: 720, bottom: 405 });
  // jsdom에는 PointerEvent가 없어 마우스 좌표가 전달되지 않으므로 테스트에서만 대신 만든다.
  if (!window.PointerEvent) window.PointerEvent = class extends MouseEvent {
    constructor(type, init = {}) { super(type, init); this.pointerId = init.pointerId; }
  };
  const { container } = page(); await enter();
  const pointer = (type, el, x, y) => fireEvent[type](el, { pointerId: 1, clientX: x, clientY: y });
  const bodySe = container.querySelector('.bp-drag-body .bp-handle-se');
  pointer('pointerDown', bodySe, 100, 100); pointer('pointerMove', bodySe, 0, 50); pointer('pointerUp', bodySe, 0, 50);
  // 왼쪽 손잡이는 오른쪽 변(10 + 500 = 510)을 고정한 채 왼쪽 변만 옮긴다. 너무 줄이면 최소 크기(20pt)에서 멈춘다.
  const bodyW = container.querySelector('.bp-drag-body .bp-handle-w');
  pointer('pointerDown', bodyW, 0, 0); pointer('pointerMove', bodyW, 30, 0); pointer('pointerUp', bodyW, 30, 0);
  const titleE = container.querySelector('.bp-drag-title .bp-handle-e');
  pointer('pointerDown', titleE, 0, 0); pointer('pointerMove', titleE, 5000, 0); pointer('pointerUp', titleE, 5000, 0);
  fireEvent.click(screen.getByRole('button', { name: 'PPT 저장…' }));
  const style = { ...defaultStyle, title: { x: 10, y: 10, width: 710, height: 50 }, body: { x: 40, y: 70, width: 470, height: 250 } };
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/download', {
    slides: [{ ...verses[0], style }, { ...verses[1], style }] }, expect.anything()));
});
test('an invalid verse is reported, keeps the typed text for fixing and leaves the existing list untouched', async () => {
  page(); await enter();
  axios.post.mockImplementation((url, body) => url.endsWith('/slides') && body.reference === '창999:1'
    ? Promise.reject({ response: { status: 400, data: { message: '확인이 필요한 구절: 창999:1' } } })
    : Promise.resolve({ data: url.endsWith('/slides') ? verses : new Blob(['test']) }));
  await add('창999:1');
  expect(await screen.findByRole('alert')).toHaveTextContent('확인이 필요한 구절: 창999:1');
  expect(screen.getByLabelText('성경 구절')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('성경 구절')).toHaveValue('창999:1');
  expect(screen.getByRole('heading', { name: '슬라이드 목록 2장' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'PPT 저장…' })).toBeEnabled();
});
test('uses the native Save As picker, writes the PPT and closes the chosen file', async () => {
  const writable = { write: jest.fn().mockResolvedValue(), close: jest.fn().mockResolvedValue(), abort: jest.fn().mockResolvedValue() };
  window.showSaveFilePicker = jest.fn().mockResolvedValue({ createWritable: jest.fn().mockResolvedValue(writable) });
  page(); await enter(); fireEvent.click(screen.getByRole('button', { name: 'PPT 저장…' }));
  await waitFor(() => expect(writable.close).toHaveBeenCalled());
  expect(window.showSaveFilePicker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: expect.stringContaining('창1_1_외1장_') }));
  expect(writable.write).toHaveBeenCalledWith(expect.any(Blob));
});
test('cancelling Save As does not generate or download a PPT', async () => {
  window.showSaveFilePicker = jest.fn().mockRejectedValue(new DOMException('cancel', 'AbortError'));
  page(); await enter(); fireEvent.click(screen.getByRole('button', { name: 'PPT 저장…' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'PPT 저장…' })).toBeEnabled());
  expect(axios.post.mock.calls.filter(([url]) => url.endsWith('/download'))).toHaveLength(0);
});

describe('projector (빔 화면)', () => {
  class FakeChannel {
    static all = [];
    constructor(name) { this.name = name; this.sent = []; FakeChannel.all.push(this); }
    postMessage(message) { this.sent.push(message); }
    close() {}
  }
  const shown = () => FakeChannel.all[0].sent.filter(m => m.type === 'show');
  const connect = () => act(() => FakeChannel.all[0].onmessage({ data: { type: 'hello' } }));
  beforeEach(() => {
    FakeChannel.all = []; global.BroadcastChannel = FakeChannel;
    window.open = jest.fn(() => ({ closed: false, close: jest.fn(), moveTo: jest.fn(), resizeTo: jest.fn() }));
    axios.post.mockImplementation((url, body) => Promise.resolve({ data: !url.endsWith('/slides') ? new Blob([body.title])
      : body.reference === '요3:16' ? [{ title: '요3:16', body: '16 하나님이 세상을' }] : verses }));
  });
  afterEach(() => { delete global.BroadcastChannel; });

  test('opens the projector window, sends slides and follows clicker keys', async () => {
    broadcastPage(); await addLive();
    fireEvent.click(screen.getByRole('button', { name: '빔 화면 열기' }));
    expect(window.open).toHaveBeenCalledWith('/bible-projector', 'banghwa-bible-projector', expect.stringContaining('popup'));
    expect(screen.getByRole('main')).not.toHaveClass('is-live-mode');
    connect();
    expect(screen.getByText('● 연결됨')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('is-live-mode');
    fireEvent.click(screen.getByRole('button', { name: '1번 슬라이드 송출' }));
    await waitFor(() => expect(shown()).toHaveLength(1));
    expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/preview', expect.objectContaining({ title: '창1:1' }),
      expect.objectContaining({ params: { width: 1600 }, responseType: 'blob' }));
    expect(screen.getByText(/지금 송출:/)).toHaveTextContent('지금 송출: 창1:1');
    fireEvent.keyDown(document.body, { key: 'PageDown' });
    await waitFor(() => expect(shown()).toHaveLength(2));
    card(2, '창1:2', true);
    fireEvent.keyDown(document.body, { key: 'b' });
    expect(FakeChannel.all[0].sent).toContainEqual({ type: 'black', on: true });
    // 입력 중에는 단축키가 동작하지 않는다.
    fireEvent.keyDown(screen.getByLabelText('성경 구절'), { key: 'ArrowLeft' });
    card(2, '창1:2', true);
    // 빔 화면 창에서 누른 키도 조작 화면이 처리한다.
    act(() => FakeChannel.all[0].onmessage({ data: { type: 'key', action: 'prev' } }));
    await waitFor(() => expect(shown()).toHaveLength(3));
    expect(FakeChannel.all[0].sent).toContainEqual({ type: 'black', on: false });
  });

  // 다른 탭(성경 PPT 만들기)에서 목록을 고친 것처럼 저장값을 바꾸고 storage 이벤트를 보낸다.
  function editInOtherTab(title, body) {
    const list = JSON.parse(localStorage.getItem(SLIDES_KEY)).map(s => (s.title === title ? { ...s, body } : s));
    const text = JSON.stringify(list);
    localStorage.setItem(SLIDES_KEY, text);
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: SLIDES_KEY, newValue: text })); });
  }

  test('a fix made in the PPT 만들기 tab updates the live slide on the projector, other slides do not resend', async () => {
    broadcastPage(); await addLive();
    fireEvent.click(screen.getByRole('button', { name: '빔 화면 열기' })); connect();
    fireEvent.click(screen.getByRole('button', { name: '1번 슬라이드 송출' }));
    await waitFor(() => expect(shown()).toHaveLength(1));
    editInOtherTab('창1:2', '2 고친 본문');
    await new Promise(r => setTimeout(r, 400));
    expect(shown()).toHaveLength(1);
    editInOtherTab('창1:1', '1 오타 수정');
    await waitFor(() => expect(shown()).toHaveLength(2));
    card(1, '창1:1', true);
    expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/preview', expect.objectContaining({ body: '1 오타 수정' }), expect.anything());
  });

  test('while on air, an added verse goes right after the live slide and is sent', async () => {
    broadcastPage(); await addLive();
    fireEvent.click(screen.getByRole('button', { name: '빔 화면 열기' })); connect();
    fireEvent.click(screen.getByRole('button', { name: '1번 슬라이드 송출' }));
    await waitFor(() => expect(shown()).toHaveLength(1));
    await add('요3:16');
    await waitFor(() => card(2, '요3:16', true));
    card(3, '창1:2');
    await waitFor(() => expect(shown()).toHaveLength(2));
    expect(screen.getByLabelText('성경 구절')).toHaveValue('');
    // ‘추가하면 바로 송출’을 끄면 송출 중이어도 목록 맨 뒤에 들어가고, 빔 화면은 그대로다.
    fireEvent.click(screen.getByRole('checkbox', { name: '추가하면 바로 송출' }));
    expect(screen.getByText(/목록 맨 뒤에 추가합니다/)).toBeInTheDocument();
    await add('요3:16');
    await waitFor(() => card(4, '요3:16'));
    expect(titles()).toEqual(['창1:1', '요3:16', '창1:2', '요3:16']);
    card(2, '요3:16', true);
    expect(shown()).toHaveLength(2);
    // 송출 화면에서 넣은 구절도 같은 목록이라 PPT 만들기에서 그대로 저장할 수 있다.
    expect(storedSlides()).toEqual([verses[0], { title: '요3:16', body: '16 하나님이 세상을' }, verses[1], { title: '요3:16', body: '16 하나님이 세상을' }]);
  });

  test('a blocked popup explains how to allow it', async () => {
    window.open = jest.fn(() => null);
    broadcastPage(); await addLive();
    fireEvent.click(screen.getByRole('button', { name: '빔 화면 열기' }));
    expect(screen.getByRole('alert')).toHaveTextContent('팝업이 차단되었습니다');
  });
});
