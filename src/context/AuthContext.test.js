import React, { useContext } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { AuthContext, AuthProvider } from './AuthContext';
import { AUTH_LOGOUT_EVENT } from '../utils/authSession';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), defaults: { headers: { common: {} } },
  interceptors: { response: { use: jest.fn(), eject: jest.fn() } } }));

const token = (sub = 'account-a', exp = Math.floor(Date.now() / 1000) + 3600) => `header.${btoa(JSON.stringify({ sub, exp }))}.signature`;
function Probe() {
  const { user, authLoading, login, logout } = useContext(AuthContext);
  return <><p>{user ? user.name : authLoading ? '검증 중' : '익명'}</p>
    <button onClick={() => login({ username: 'account-b', name: '새 로그인', role: 'USER', accessToken: token('account-b') })}>새 로그인</button>
    <button onClick={() => logout()}>로그아웃</button></>;
}
const mount = () => render(<AuthProvider><Probe /></AuthProvider>);
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); jest.clearAllMocks(); axios.defaults.headers.common = {};
  axios.post.mockImplementation((url, body, config) => Promise.resolve({ data: {
    ...JSON.parse(sessionStorage.getItem('user')), accessToken: config.headers.Authorization.slice(7),
  } }));
});
afterEach(() => jest.useRealTimers());

test('an unverified cached name is never rendered, and only server identity replaces it', async () => {
  let resolve;
  axios.get.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  sessionStorage.setItem('accessToken', token());
  sessionStorage.setItem('user', JSON.stringify({ username: 'wrong-account', name: '다른 PC의 남은 이름', role: 'ADMIN' }));
  mount();
  expect(screen.queryByText('다른 PC의 남은 이름')).not.toBeInTheDocument();
  expect(screen.getByText('검증 중')).toBeInTheDocument();
  await act(async () => resolve({ data: { username: 'account-a', name: '서버가 확인한 이름', role: 'USER' } }));
  expect(screen.getByText('서버가 확인한 이름')).toBeInTheDocument();
  expect(JSON.parse(sessionStorage.getItem('user')).role).toBe('USER');
});

test('cached names in persistent storage never log in or call the profile API', () => {
  localStorage.setItem('user', JSON.stringify({ name: '남은 관리자' }));
  localStorage.setItem('accessToken', token());
  mount();
  expect(screen.getByText('익명')).toBeInTheDocument();
  expect(axios.get).not.toHaveBeenCalled();
  expect(localStorage.getItem('user')).toBeNull();
});

test('rejected or mismatched identities clear names, credentials and default headers', async () => {
  sessionStorage.setItem('accessToken', token());
  axios.defaults.headers.common.Authorization = 'Bearer leftover-token';
  axios.get.mockResolvedValueOnce({ data: { username: 'other-account', name: '다른 사람', role: 'ADMIN' } });
  mount();
  expect(await screen.findByText('익명')).toBeInTheDocument();
  expect(screen.queryByText('다른 사람')).not.toBeInTheDocument();
  expect(sessionStorage.getItem('accessToken')).toBeNull();
  expect(axios.defaults.headers.common.Authorization).toBeUndefined();
});

test('late profile responses cannot restore a logged-out account', async () => {
  let resolve;
  sessionStorage.setItem('accessToken', token());
  axios.get.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  mount(); fireEvent.click(screen.getByText('로그아웃'));
  await act(async () => resolve({ data: { username: 'account-a', name: '이전 계정', role: 'ADMIN' } }));
  expect(screen.getByText('익명')).toBeInTheDocument();
  expect(sessionStorage.getItem('user')).toBeNull();
});

test('a logout in another tab clears this tab without transmitting names or tokens', async () => {
  mount(); fireEvent.click(screen.getByText('새 로그인'));
  expect(screen.getByText('새 로그인', { selector: 'p' })).toBeInTheDocument();
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: AUTH_LOGOUT_EVENT, newValue: 'logout-event' })));
  expect(screen.getByText('익명')).toBeInTheDocument();
  expect(sessionStorage.getItem('accessToken')).toBeNull();
});

test('token expiry removes the header identity without requiring a protected API request', async () => {
  jest.useFakeTimers();
  sessionStorage.setItem('accessToken', token('account-a', Math.floor(Date.now() / 1000) + 2));
  axios.get.mockResolvedValueOnce({ data: { username: 'account-a', name: '만료 전 이름', role: 'USER' } });
  mount(); await waitFor(() => expect(screen.getByText('만료 전 이름')).toBeInTheDocument());
  act(() => jest.advanceTimersByTime(2100));
  expect(screen.getByText('익명')).toBeInTheDocument();
  expect(sessionStorage.getItem('accessToken')).toBeNull();
});

test('the real homepage header loses the account name at expiry with no click or navigation', async () => {
  jest.useFakeTimers();
  sessionStorage.setItem('accessToken', token('account-a', Math.floor(Date.now() / 1000) + 2));
  axios.get.mockImplementation(url => Promise.resolve({ data: url === '/api/profile'
    ? { username: 'account-a', name: '우측 상단 이름', role: 'ADMIN' } : { content: [] } }));
  const { container } = render(<MemoryRouter><AuthProvider><Header /></AuthProvider></MemoryRouter>);
  expect(await screen.findByText('우측 상단 이름님')).toBeInTheDocument();
  const requestsBeforeExpiry = axios.get.mock.calls.length;
  act(() => jest.advanceTimersByTime(2100));
  expect(container.querySelector('.user-name')).toBeNull();
  expect(axios.get).toHaveBeenCalledTimes(requestsBeforeExpiry);
  expect(sessionStorage.getItem('user')).toBeNull();
});

test('returning from sleep clears expired identity immediately before any profile call', async () => {
  jest.useFakeTimers();
  sessionStorage.setItem('accessToken', token('account-a', Math.floor(Date.now() / 1000) + 60));
  axios.get.mockResolvedValue({ data: { username: 'account-a', name: '복귀 전 이름', role: 'USER' } });
  mount(); expect(await screen.findByText('복귀 전 이름')).toBeInTheDocument();
  const calls = axios.get.mock.calls.length;
  jest.setSystemTime(Date.now() + 61000);
  act(() => window.dispatchEvent(new Event('focus')));
  expect(screen.getByText('익명')).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledTimes(calls);
});

test('server invalidation is noticed while staying idle on a public page', async () => {
  jest.useFakeTimers();
  sessionStorage.setItem('accessToken', token());
  axios.get.mockResolvedValueOnce({ data: { username: 'account-a', name: '서버 만료 전 이름', role: 'USER' } });
  mount(); expect(await screen.findByText('서버 만료 전 이름')).toBeInTheDocument();
  axios.get.mockRejectedValueOnce({ response: { status: 401 } });
  await act(async () => jest.advanceTimersByTime(30000));
  expect(screen.getByText('익명')).toBeInTheDocument();
  expect(sessionStorage.getItem('accessToken')).toBeNull();
});

test('reload renews with the server, while idle verification never renews the session', async () => {
  jest.useFakeTimers();
  const before = token('account-a', Math.floor(Date.now() / 1000) + 300);
  const renewed = token('account-a');
  sessionStorage.setItem('accessToken', before);
  axios.get.mockResolvedValue({ data: { username: 'account-a', name: '활동 중', role: 'USER' } });
  axios.post.mockResolvedValueOnce({ data: { username: 'account-a', name: '활동 중', role: 'USER', accessToken: renewed } });
  mount(); await waitFor(() => expect(sessionStorage.getItem('accessToken')).toBe(renewed));
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledWith('/api/auth/renew', null, expect.objectContaining({ headers: { Authorization: `Bearer ${before}` } }));
  await act(async () => jest.advanceTimersByTime(30000));
  expect(axios.post).toHaveBeenCalledTimes(1);
});

test('plain header shows countdown and activity updates it only after successful server renewal', async () => {
  jest.useFakeTimers();
  sessionStorage.setItem('accessToken', token('account-a', Math.floor(Date.now() / 1000) + 60));
  axios.get.mockImplementation(url => Promise.resolve({ data: url === '/api/profile'
    ? { username: 'account-a', name: '테스트 관리자', role: 'ADMIN' } : { content: [] } }));
  const { container } = render(<MemoryRouter><AuthProvider><Header /></AuthProvider></MemoryRouter>);
  expect(await screen.findByText('테스트 관리자님')).toBeInTheDocument();
  await act(async () => {});
  expect(container.querySelector('.user-menu-trigger')).toBeNull();
  expect(screen.getByRole('link', { name: '내 정보', exact: true })).toBeVisible();
  act(() => jest.advanceTimersByTime(10000));
  expect(screen.getByRole('timer')).toHaveTextContent('00:50');
  const newToken = token();
  axios.post.mockResolvedValueOnce({ data: { username: 'account-a', name: '테스트 관리자', role: 'ADMIN', accessToken: newToken } });
  fireEvent.click(screen.getByRole('link', { name: '교회소개', exact: true }));
  expect(screen.getByRole('timer')).toHaveTextContent('00:50');
  await act(async () => jest.advanceTimersByTime(500));
  expect(sessionStorage.getItem('accessToken')).toBe(newToken);
  expect(screen.getByRole('timer')).toHaveTextContent('60:00');
});

test('a late renewal response cannot resurrect a logged-out session', async () => {
  let resolve;
  sessionStorage.setItem('accessToken', token());
  axios.get.mockResolvedValueOnce({ data: { username: 'account-a', name: '갱신 전', role: 'USER' } });
  axios.post.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  mount(); await screen.findByText('갱신 전');
  fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
  await act(async () => resolve({ data: { username: 'account-a', name: '갱신 전', role: 'USER', accessToken: token() } }));
  expect(screen.getByText('익명')).toBeInTheDocument();
  expect(sessionStorage.getItem('accessToken')).toBeNull();
});
