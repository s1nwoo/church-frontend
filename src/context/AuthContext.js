import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AUTH_LOGOUT_EVENT, clearAuthSession, clearDefaultAuthorization, clearLegacyAuth, getAccessToken, storeAuthSession, tokenClaims, tokenExpiresAt } from '../utils/authSession';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getAccessToken()));
  const generation = useRef(0);
  const verifiedToken = useRef(null);
  const logout = useCallback((broadcast = true) => {
    generation.current += 1;
    verifiedToken.current = null;
    clearAuthSession(); clearDefaultAuthorization(axios);
    setUser(null); setAuthLoading(false);
    if (broadcast) {
      try { localStorage.setItem(AUTH_LOGOUT_EVENT, `${Date.now()}-${Math.random()}`); } catch {}
    }
  }, []);
  const login = useCallback(data => {
    if (tokenExpiresAt(data?.accessToken) <= Date.now()) {
      logout();
      throw new Error('로그인 정보가 만료되었습니다. 다시 로그인해 주세요.');
    }
    generation.current += 1;
    verifiedToken.current = data.accessToken;
    clearDefaultAuthorization(axios);
    setUser(storeAuthSession(data)); setAuthLoading(false);
  }, [logout]);

  useEffect(() => {
    clearLegacyAuth(); clearDefaultAuthorization(axios);
    let active = true;
    let renewal = null;
    let activityTimer;
    let activityDeadlineTimer;
    async function renewSession() {
      if (renewal) return renewal;
      const token = getAccessToken();
      if (!token || verifiedToken.current !== token) return;
      if (tokenExpiresAt(token) <= Date.now()) { logout(); return; }
      const epoch = generation.current;
      renewal = (async () => {
        try {
          const { data } = await axios.post('/api/auth/renew', null, {
            headers: { Authorization: `Bearer ${token}` }, withCredentials: false, timeout: 10000,
          });
          if (!active || epoch !== generation.current || token !== getAccessToken()) return;
          if (!data?.username || !data?.role || tokenClaims(token)?.sub !== data.username
              || tokenClaims(data.accessToken)?.sub !== data.username || tokenExpiresAt(data.accessToken) <= Date.now()) {
            logout(); return;
          }
          generation.current += 1;
          verifiedToken.current = data.accessToken;
          setUser(storeAuthSession(data)); setAuthLoading(false);
        } catch (error) {
          if (active && epoch === generation.current && token === getAccessToken()
              && [401, 403].includes(error.response?.status)) logout();
          // A failed renewal never extends the locally displayed deadline.
        } finally { renewal = null; }
      })();
      return renewal;
    }
    async function verify(renewAfterVerification = false) {
      const token = getAccessToken();
      const requestGeneration = generation.current;
      if (!token) { clearAuthSession(); setUser(null); setAuthLoading(false); return; }
      const claims = tokenClaims(token);
      if (tokenExpiresAt(token) <= Date.now()) { logout(); return; }
      if (verifiedToken.current !== token) { setUser(null); setAuthLoading(true); }
      try {
        const { data } = await axios.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }, withCredentials: false,
        });
        if (!active || requestGeneration !== generation.current || token !== getAccessToken()) return;
        if (tokenExpiresAt(token) <= Date.now()) { logout(); return; }
        if (!data?.username || !data?.role || (claims?.sub && claims.sub !== data.username)) {
          logout(); return;
        }
        verifiedToken.current = token;
        setUser(storeAuthSession({ ...data, accessToken: token })); setAuthLoading(false);
        if (renewAfterVerification === true) await renewSession();
      } catch {
        if (active && requestGeneration === generation.current && token === getAccessToken()) logout();
      }
    }
    verify(true);
    function flushActivity() {
      clearTimeout(activityTimer); clearTimeout(activityDeadlineTimer);
      activityDeadlineTimer = null;
      renewSession();
    }
    function onActivity(event) {
      if (event.target?.closest?.('[data-auth-logout]') || !getAccessToken() || document.visibilityState !== 'visible') return;
      clearTimeout(activityTimer);
      // Coalesce a click's pointer/input events and rapid typing into one renewal.
      activityTimer = setTimeout(flushActivity, 500);
      if (!activityDeadlineTimer) activityDeadlineTimer = setTimeout(flushActivity, 5000);
    }
    function onStorage(event) { if (event.key === AUTH_LOGOUT_EVENT) logout(false); }
    function onVisibility() { if (document.visibilityState === 'visible') verify(); }
    const activityEvents = ['pointerdown', 'click', 'keydown', 'input', 'scroll'];
    activityEvents.forEach(name => document.addEventListener(name, onActivity, { capture: true, passive: true }));
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', verify);
    window.addEventListener('pageshow', verify);
    document.addEventListener('visibilitychange', onVisibility);
    // Detect server-side invalidation while the user stays on a public page.
    const verificationTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && getAccessToken()) verify();
    }, 30000);
    const interceptor = axios.interceptors.response.use(response => response, error => {
      const authorization = error.config?.headers?.Authorization || error.config?.headers?.authorization;
      const token = getAccessToken();
      if (error.response?.status === 401 && token && authorization === `Bearer ${token}`
          && !error.config?.url?.includes('/api/auth/login')) logout();
      return Promise.reject(error);
    });
    return () => {
      active = false;
      clearTimeout(activityTimer);
      clearTimeout(activityDeadlineTimer);
      activityEvents.forEach(name => document.removeEventListener(name, onActivity, true));
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', verify);
      window.removeEventListener('pageshow', verify);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(verificationTimer);
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  useEffect(() => {
    if (!user) return;
    function checkExpiry() {
      const token = getAccessToken();
      if (token !== user.accessToken || tokenExpiresAt(token) <= Date.now()) logout();
    }
    checkExpiry();
    const timer = setTimeout(checkExpiry, Math.max(0, Math.min(tokenExpiresAt(user.accessToken) - Date.now(), 2147483647)));
    // Browsers may delay timers during sleep or while a tab is in the background.
    const watchdog = setInterval(checkExpiry, 1000);
    return () => { clearTimeout(timer); clearInterval(watchdog); };
  }, [user, logout]);

  return <AuthContext.Provider value={{ user, authLoading, login, logout }}>{children}</AuthContext.Provider>;
};
