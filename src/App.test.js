import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), isCancel: jest.fn() }));
jest.mock('./components/Header', () => () => null);
jest.mock('./components/Footer', () => () => null);
jest.mock('./components/ScrollToTop', () => () => null);
jest.mock('./components/MainIntroSection', () => () => '홈 화면');
jest.mock('./components/SermonSection', () => () => null);

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

test.each(['/admin', '/admin/members', '/admin/sermons', '/admin/posts', '/admin/card-slider', '/admin/bible-ppt'])(
  'opening %s anonymously goes directly to administrator login', async path => {
  window.history.replaceState({}, '', path);
  render(<App />);
  expect(await screen.findByRole('heading', { name: '관리자 로그인' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
  expect(screen.queryByRole('heading', { name: '관리자 메뉴' })).not.toBeInTheDocument();
  expect(axios.get).not.toHaveBeenCalled();
});

function submitLogin() {
  fireEvent.change(screen.getByPlaceholderText('아이디 입력'), { target: { value: 'test-account' } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호 입력'), { target: { value: 'test-password' } });
  fireEvent.click(screen.getByRole('button', { name: '로그인', exact: true }));
}

test.each(['/admin', '/login'])('successful administrator login from %s opens the admin menu', async path => {
  window.history.replaceState({}, '', path);
  axios.post.mockResolvedValueOnce({ data: { username: 'test-account', role: 'ROLE_ADMIN', accessToken: 'new-admin-token' } });
  render(<App />);
  await screen.findByPlaceholderText('아이디 입력');
  submitLogin();
  expect(await screen.findByRole('heading', { name: '관리자 메뉴' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/admin');
  expect(localStorage.getItem('accessToken')).toBe('new-admin-token');
});

test('administrator entry rejects a normal member account without opening the admin menu', async () => {
  window.history.replaceState({}, '', '/admin');
  axios.post.mockResolvedValueOnce({ data: { role: 'ROLE_USER', accessToken: 'member-token' } });
  render(<App />);
  await screen.findByPlaceholderText('아이디 입력'); submitLogin();
  expect(await screen.findByText('관리자 계정으로 로그인해 주세요.')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
  expect(localStorage.getItem('accessToken')).toBeNull();
  expect(screen.queryByRole('heading', { name: '관리자 메뉴' })).not.toBeInTheDocument();
});

test('normal member login on the regular login page still opens the home page', async () => {
  window.history.replaceState({}, '', '/login');
  axios.post.mockResolvedValueOnce({ data: { role: 'ROLE_USER', accessToken: 'member-token' } });
  render(<App />); submitLogin();
  await waitFor(() => expect(window.location.pathname).toBe('/'));
  expect(await screen.findByText('홈 화면')).toBeInTheDocument();
});

test('a stored administrator without a token must log in again', async () => {
  localStorage.setItem('user', JSON.stringify({ role: 'ROLE_ADMIN' }));
  window.history.replaceState({}, '', '/admin'); render(<App />);
  expect(await screen.findByRole('heading', { name: '관리자 로그인' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
});

test('malformed saved user data falls back to login instead of crashing', async () => {
  localStorage.setItem('user', '{invalid');
  window.history.replaceState({}, '', '/admin'); render(<App />);
  expect(await screen.findByRole('heading', { name: '관리자 로그인' })).toBeInTheDocument();
});

test('a logged-in normal member cannot open admin screens', async () => {
  localStorage.setItem('user', JSON.stringify({ role: 'ROLE_USER' }));
  localStorage.setItem('accessToken', 'member-token');
  window.history.replaceState({}, '', '/admin/members'); render(<App />);
  expect(await screen.findByRole('heading', { name: '관리자 권한이 필요합니다.' })).toBeInTheDocument();
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
