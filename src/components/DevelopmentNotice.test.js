import { resetDevelopmentSession } from './DevelopmentNotice';
beforeEach(() => localStorage.clear());
test('switching API invalidates old credentials but preserves game records', () => {
  localStorage.setItem('accessToken', 'local-only-token');
  localStorage.setItem('user', '{}');
  localStorage.setItem('refreshToken', 'local-refresh-token');
  localStorage.setItem('bhbc.admin.yut.v1', 'saved-game');
  expect(resetDevelopmentSession(localStorage, 'https://api.bhbc.kr')).toBe(true);
  expect(localStorage.getItem('accessToken')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
  expect(localStorage.getItem('refreshToken')).toBeNull();
  expect(localStorage.getItem('bhbc.admin.yut.v1')).toBe('saved-game');
});
test('same API preserves current login across refreshes', () => {
  resetDevelopmentSession(localStorage, 'https://api.bhbc.kr');
  localStorage.setItem('accessToken', 'existing-token');
  expect(resetDevelopmentSession(localStorage, 'https://api.bhbc.kr')).toBe(false);
  expect(localStorage.getItem('accessToken')).toBe('existing-token');
});
