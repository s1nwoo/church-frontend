import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), isCancel: jest.fn() }));
jest.mock('./components/Header', () => () => null);
jest.mock('./components/Footer', () => () => null);
jest.mock('./components/ScrollToTop', () => () => null);

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
  axios.get.mockResolvedValue({ data: { content: [], users: [], totalPages: 0, books: [], width: 720, height: 540,
    defaultStyle: { titleFontSize: 21, bodyFontSize: 50,
      title: { x: 20, y: 20, width: 680, height: 40 }, body: { x: 20, y: 80, width: 680, height: 420 } } } });
});

test('the admin menu opens the Bible PPT editor through the registered route', async () => {
  window.history.replaceState({}, '', '/admin');
  localStorage.setItem('user', JSON.stringify({ role: 'ROLE_ADMIN' }));
  localStorage.setItem('accessToken', 'admin-token');
  render(<App />);
  fireEvent.click(screen.getByText('성경 PPT 만들기'));
  expect(await screen.findByLabelText('성경 구절')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/admin/bible-ppt');
});

test('opening the Bible PPT route anonymously asks for administrator login', () => {
  window.history.replaceState({}, '', '/admin/bible-ppt');
  render(<App />);
  expect(screen.getByText('관리자 로그인 후 이용할 수 있습니다.')).toBeInTheDocument();
  expect(axios.get).not.toHaveBeenCalled();
});

test.each([
  ['/admin/members', '성도 관리'],
  ['/admin/sermons', '영상 관리'],
  ['/admin/posts', '소식 관리'],
  ['/admin/card-slider', '카드 슬라이더 관리'],
  ['/admin/bible-ppt', '성경 PPT 만들기'],
])('a direct visit to %s can return to the admin list', async (path, title) => {
  window.history.replaceState({}, '', path);
  localStorage.setItem('user', JSON.stringify({ role: 'ROLE_ADMIN' }));
  localStorage.setItem('accessToken', 'admin-token');
  render(<App />);
  expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: '이전: 관리자 목록으로' }));
  expect(await screen.findByRole('heading', { name: '관리자 메뉴' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/admin');
});
