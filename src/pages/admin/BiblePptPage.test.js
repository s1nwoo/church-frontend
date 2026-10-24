import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import BiblePptPage from './BiblePptPage';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
const defaultStyle = { titleFontSize: 32, bodyFontSize: 40,
  title: { x: 10, y: 10, width: 600, height: 50 }, body: { x: 10, y: 70, width: 600, height: 300 } };
const verses = [{ title: '창1:1', body: '1 태초에 하나님이' }, { title: '창1:2', body: '2 땅이 혼돈하고' }];
const STYLE_KEY = 'banghwa-bible-ppt-style-v1';
function page(user = { role: 'ADMIN' }) {
  return render(<MemoryRouter><AuthContext.Provider value={{ user }}><BiblePptPage /></AuthContext.Provider></MemoryRouter>);
}
async function enter(value = '창1:1-2') {
  fireEvent.change(await screen.findByLabelText('성경 구절'), { target: { value } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'PPT 저장…' })).toBeEnabled());
}
function openEditor() { fireEvent.click(screen.getByText('본문 편집 · 위치와 상자 크기 직접 입력')); }
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear(); localStorage.setItem('accessToken', 'admin-token');
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
test('shows all four work areas, blank unlimited input and sliders before any verse is entered', async () => {
  page(); await screen.findByLabelText('성경 검색');
  for (const name of ['① 성경 검색', '② 구절 입력', /③ 슬라이드 목록/, '④ 실제 미리보기']) {
    expect(screen.getByRole('heading', { name })).toBeVisible();
  }
  expect(screen.getByLabelText('줄 수 제한')).toHaveValue(null);
  expect(screen.getByRole('slider', { name: '제목 크기' })).toBeVisible();
  expect(screen.getByText('말씀 슬라이드 미리보기')).toBeVisible();
  expect(screen.getByRole('button', { name: '현재 설정 저장' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'PPT 저장…' })).toBeDisabled();
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
  expect(screen.getByLabelText('성경 구절')).toHaveValue('창1:2-3');
  await waitFor(() => expect(screen.getByLabelText('1번 슬라이드 선택')).toBeEnabled());
});
test('automatically generates slides and updates them when the line limit changes', async () => {
  page(); await enter();
  expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/slides', { reference: '창1:1-2', lineLimit: 0 },
    expect.objectContaining({ headers: { Authorization: 'Bearer admin-token' } }));
  fireEvent.change(screen.getByLabelText('줄 수 제한'), { target: { value: '3' } });
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/slides', { reference: '창1:1-2', lineLimit: 3 }, expect.anything()));
});
test('merges contiguous references, splits, edits, names and downloads the deck', async () => {
  page(); await enter(); openEditor();
  fireEvent.click(screen.getByLabelText('1번 슬라이드 선택')); fireEvent.click(screen.getByLabelText('2번 슬라이드 선택'));
  fireEvent.click(screen.getByRole('button', { name: '선택한 슬라이드 합치기' }));
  expect(screen.getByLabelText('슬라이드 제목')).toHaveValue('창1:1-2');
  expect(screen.getByLabelText('본문')).toHaveValue('1 태초에 하나님이\n2 땅이 혼돈하고');
  fireEvent.click(screen.getByRole('button', { name: '나누기' }));
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
  fireEvent.click(screen.getByRole('button', { name: /슬라이드 1 \[창1:1\]/ }));
  fireEvent.click(screen.getByRole('button', { name: /슬라이드 2 \[창1:2\]/ }), { shiftKey: true });
  expect(screen.getByRole('button', { name: '선택한 슬라이드 합치기' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: /슬라이드 1 \[창1:1\]/ }), { ctrlKey: true });
  expect(screen.getByLabelText('1번 슬라이드 선택')).not.toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: '이 슬라이드에만 적용' }));
  fireEvent.change(screen.getByRole('slider', { name: '본문 크기' }), { target: { value: '55' } });
  fireEvent.click(screen.getByRole('button', { name: 'PPT 저장…' }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/download', {
    slides: [{ ...verses[0], style: { ...defaultStyle, bodyFontSize: 55 } }, { ...verses[1], style: defaultStyle }]
  }, expect.anything()));
});
test('invalid references are marked immediately after validation and cannot export the previous deck', async () => {
  page(); await enter();
  axios.post.mockImplementation((url, body) => url.endsWith('/slides') && body.reference === '창999:1'
    ? Promise.reject({ response: { status: 400, data: { message: '확인이 필요한 구절: 창999:1' } } })
    : Promise.resolve({ data: url.endsWith('/slides') ? verses : new Blob(['test']) }));
  fireEvent.change(screen.getByLabelText('성경 구절'), { target: { value: '창999:1' } });
  expect(screen.getByRole('button', { name: 'PPT 저장…' })).toBeDisabled();
  expect(await screen.findByRole('alert')).toHaveTextContent('확인이 필요한 구절: 창999:1');
  expect(screen.getByLabelText('성경 구절')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('button', { name: 'PPT 저장…' })).toBeDisabled();
});
test('a stale successful request cannot replace newer slides', async () => {
  let resolveOld;
  axios.post.mockImplementation((url, body) => url.endsWith('/slides') && body.reference === '창1:1'
    ? new Promise(resolve => { resolveOld = resolve; })
    : Promise.resolve({ data: url.endsWith('/slides') ? [{ title: '출1:1', body: '새로운 본문' }] : new Blob(['test']) }));
  page(); fireEvent.change(await screen.findByLabelText('성경 구절'), { target: { value: '창1:1' } });
  await waitFor(() => expect(resolveOld).toBeDefined());
  await enter('출1:1');
  await act(async () => resolveOld({ data: verses }));
  expect(screen.getByRole('button', { name: /슬라이드 1 \[출1:1\]/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /슬라이드 1 \[창1:1\]/ })).not.toBeInTheDocument();
});
test('uses the native Save As picker, writes the PPT and closes the chosen file', async () => {
  const writable = { write: jest.fn().mockResolvedValue(), close: jest.fn().mockResolvedValue(), abort: jest.fn().mockResolvedValue() };
  window.showSaveFilePicker = jest.fn().mockResolvedValue({ createWritable: jest.fn().mockResolvedValue(writable) });
  page(); await enter(); fireEvent.click(screen.getByRole('button', { name: 'PPT 저장…' }));
  await waitFor(() => expect(writable.close).toHaveBeenCalled());
  expect(window.showSaveFilePicker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: expect.stringContaining('창1_1-2_') }));
  expect(writable.write).toHaveBeenCalledWith(expect.any(Blob));
});
test('cancelling Save As does not generate or download a PPT', async () => {
  window.showSaveFilePicker = jest.fn().mockRejectedValue(new DOMException('cancel', 'AbortError'));
  page(); await enter(); fireEvent.click(screen.getByRole('button', { name: 'PPT 저장…' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'PPT 저장…' })).toBeEnabled());
  expect(axios.post.mock.calls.filter(([url]) => url.endsWith('/download'))).toHaveLength(0);
});
