import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import BiblePptPage from './BiblePptPage';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), isCancel: jest.fn() }));
const defaultStyle = { titleFontSize: 32, bodyFontSize: 40,
  title: { x: 10, y: 10, width: 600, height: 50 }, body: { x: 10, y: 70, width: 600, height: 300 } };
const verses = [{ title: '창1:1', body: '1 태초에 하나님이' }, { title: '창1:2', body: '2 땅이 혼돈하고' }];

function page(user = { role: 'ADMIN' }) {
  return render(<MemoryRouter><AuthContext.Provider value={{ user }}><BiblePptPage /></AuthContext.Provider></MemoryRouter>);
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('accessToken', 'admin-token');
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
  axios.isCancel.mockReturnValue(false);
  axios.get.mockResolvedValue({ data: { books: [{ name: '창세기', abbreviation: '창' }], width: 720, height: 405, defaultStyle } });
  axios.post.mockImplementation(url => Promise.resolve({ data: url.endsWith('/slides') ? verses : new Blob(['test']) }));
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test('requires an administrator before fetching Bible data', () => {
  page({ role: 'USER' });
  expect(screen.getByRole('link', { name: '로그인하기' })).toBeInTheDocument();
  expect(axios.get).not.toHaveBeenCalled();
});

test('builds, merges, restores and exports the edited deck using the login token', async () => {
  page();
  const input = await screen.findByLabelText('성경 구절');
  fireEvent.change(input, { target: { value: '창1:1-2' } });
  fireEvent.click(screen.getByRole('button', { name: '슬라이드 만들기' }));
  await screen.findByLabelText('1번 슬라이드 선택');
  expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/slides', { reference: '창1:1-2', lineLimit: 3 },
    { headers: { Authorization: 'Bearer admin-token' } });
  fireEvent.click(screen.getByLabelText('1번 슬라이드 선택'));
  fireEvent.click(screen.getByLabelText('2번 슬라이드 선택'));
  fireEvent.click(screen.getByRole('button', { name: '선택 합치기' }));
  expect(screen.queryByLabelText('2번 슬라이드 선택')).not.toBeInTheDocument();
  expect(screen.getByLabelText('본문')).toHaveValue('1 태초에 하나님이\n2 땅이 혼돈하고');
  fireEvent.click(screen.getByRole('button', { name: '원래대로 나누기' }));
  expect(screen.getByLabelText('2번 슬라이드 선택')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('본문'), { target: { value: '1 편집한 본문' } });
  fireEvent.click(screen.getByRole('button', { name: 'PPT 다운로드' }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/admin/bible-ppt/download', {
    slides: [{ ...verses[0], body: '1 편집한 본문', style: defaultStyle }, { ...verses[1], style: defaultStyle }]
  }, expect.objectContaining({ responseType: 'blob' })));
  await screen.findByText('PPT 파일을 다운로드했습니다.');
});

test('reports invalid references and retains the current edited deck', async () => {
  page();
  fireEvent.change(await screen.findByLabelText('성경 구절'), { target: { value: '창1:1' } });
  fireEvent.click(screen.getByRole('button', { name: '슬라이드 만들기' }));
  await screen.findByLabelText('1번 슬라이드 선택');
  axios.post.mockRejectedValueOnce({ response: { status: 400, data: { message: '확인이 필요한 구절: 창999:1' } } });
  fireEvent.change(screen.getByLabelText('성경 구절'), { target: { value: '창999:1' } });
  fireEvent.click(screen.getByRole('button', { name: '슬라이드 만들기' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('확인이 필요한 구절: 창999:1');
  expect(screen.getByLabelText('본문')).toHaveValue(verses[0].body);
});
