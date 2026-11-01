export const AUTH_LOGOUT_EVENT = 'bhbc.auth.logout';
const AUTH_KEYS = ['user', 'accessToken', 'refreshToken', 'token', 'userRole'];

export function clearLegacyAuth() {
  AUTH_KEYS.forEach(key => { try { window.localStorage.removeItem(key); } catch {} });
}

export function getAccessToken() {
  try {
    const token = window.sessionStorage.getItem('accessToken');
    return token && token !== 'undefined' && token !== 'null' ? token : null;
  } catch { return null; }
}

export function tokenClaims(token) {
  try {
    const bytes = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(Array.from(bytes, char => '%' + char.charCodeAt(0).toString(16).padStart(2, '0')).join('')));
  }
  catch { return null; }
}

export function tokenExpiresAt(token) {
  const exp = tokenClaims(token)?.exp;
  return typeof exp === 'number' && Number.isFinite(exp) && exp > 0 ? exp * 1000 : 0;
}

export function clearAuthSession() {
  AUTH_KEYS.forEach(key => { try { window.sessionStorage.removeItem(key); } catch {} });
  clearLegacyAuth();
}

export function storeAuthSession(user) {
  if (!user?.accessToken) throw new Error('인증 토큰이 없습니다. 다시 로그인해 주세요.');
  clearLegacyAuth();
  const account = { id: user.id, username: user.username, name: user.name, role: user.role, email: user.email };
  window.sessionStorage.setItem('user', JSON.stringify(account));
  window.sessionStorage.setItem('accessToken', user.accessToken);
  return { ...account, accessToken: user.accessToken };
}

export function clearDefaultAuthorization(client) {
  const headers = client.defaults?.headers;
  if (!headers) return;
  [headers, headers.common, headers.get, headers.post, headers.put, headers.patch, headers.delete].forEach(group => {
    if (group) { delete group.Authorization; delete group.authorization; }
  });
}

export function installSessionAuthorization(client) {
  clearDefaultAuthorization(client);
  return client.interceptors.request.use(config => {
    const base = new URL(client.defaults.baseURL || window.location.origin, window.location.origin);
    const target = new URL(config.url || '', config.baseURL || base.href);
    const isApi = target.origin === base.origin && target.pathname.startsWith('/api/');
    const token = isApi && !target.pathname.startsWith('/api/auth/') ? getAccessToken() : null;
    config.withCredentials = false;
    config.headers = config.headers || {};
    delete config.headers.Authorization; delete config.headers.authorization;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}
