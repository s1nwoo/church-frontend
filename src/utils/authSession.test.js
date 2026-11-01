import { clearAuthSession, getAccessToken, installSessionAuthorization, storeAuthSession, tokenClaims } from './authSession';

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

test('persistent credentials never establish a session and migration preserves game records', () => {
  localStorage.setItem('user', JSON.stringify({ name: '남아 있는 이름' }));
  localStorage.setItem('accessToken', 'old-persistent-token');
  localStorage.setItem('bhbc.admin.yut.v1', 'game-record');
  expect(getAccessToken()).toBeNull();
  storeAuthSession({ username: 'current-account', accessToken: 'current-session-token', role: 'USER', password: 'never-store-this' });
  expect(localStorage.getItem('accessToken')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
  expect(sessionStorage.getItem('user')).not.toContain('never-store-this');
  expect(localStorage.getItem('bhbc.admin.yut.v1')).toBe('game-record');
});

test('requests use only the current session token and never carry it to another host', () => {
  let authorize;
  const client = { defaults: { baseURL: 'https://api.example.invalid', headers: { common: { Authorization: 'Bearer stale-token' } } },
    interceptors: { request: { use: fn => { authorize = fn; return 1; } } } };
  installSessionAuthorization(client);
  expect(client.defaults.headers.common.Authorization).toBeUndefined();
  storeAuthSession({ accessToken: 'session-token' });
  expect(authorize({ url: '/api/admin/posts', headers: { Authorization: 'Bearer stale-token' } })).toMatchObject({
    headers: { Authorization: 'Bearer session-token' }, withCredentials: false,
  });
  expect(authorize({ url: 'https://other.example.invalid/api/profile', headers: { Authorization: 'Bearer session-token' } }).headers.Authorization).toBeUndefined();
  expect(authorize({ url: '/api/auth/login', headers: {} }).headers.Authorization).toBeUndefined();
  expect(authorize({ url: '/api/auth/renew', headers: {} }).headers.Authorization).toBe('Bearer session-token');
  clearAuthSession();
  expect(authorize({ url: '/api/profile', headers: { Authorization: 'Bearer stale-token' } }).headers.Authorization).toBeUndefined();
});

test('JWT identity decoding handles UTF-8 usernames', () => {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ sub: '사용자', exp: 123 }))));
  expect(tokenClaims(`header.${payload}.signature`).sub).toBe('사용자');
});
