import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AUTH_LOGOUT_EVENT, clearAuthSession, clearDefaultAuthorization, clearLegacyAuth, getAccessToken, storeAuthSession, tokenClaims } from '../utils/authSession';

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
    generation.current += 1;
    verifiedToken.current = data.accessToken;
    clearDefaultAuthorization(axios);
    setUser(storeAuthSession(data)); setAuthLoading(false);
  }, []);

  useEffect(() => {
    clearLegacyAuth(); clearDefaultAuthorization(axios);
    let active = true;
    async function verify() {
      const token = getAccessToken();
      const requestGeneration = ++generation.current;
      if (!token) { clearAuthSession(); setUser(null); setAuthLoading(false); return; }
      const claims = tokenClaims(token);
      if (claims?.exp && claims.exp * 1000 <= Date.now()) { logout(); return; }
      if (verifiedToken.current !== token) { setUser(null); setAuthLoading(true); }
      try {
        const { data } = await axios.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }, withCredentials: false,
        });
        if (!active || requestGeneration !== generation.current || token !== getAccessToken()) return;
        if (!data?.username || !data?.role || (claims?.sub && claims.sub !== data.username)) {
          logout(); return;
        }
        verifiedToken.current = token;
        setUser(storeAuthSession({ ...data, accessToken: token })); setAuthLoading(false);
      } catch {
        if (active && requestGeneration === generation.current && token === getAccessToken()) logout();
      }
    }
    verify();
    function onStorage(event) { if (event.key === AUTH_LOGOUT_EVENT) logout(false); }
    function onVisibility() { if (document.visibilityState === 'visible') verify(); }
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);
    const interceptor = axios.interceptors.response.use(response => response, error => {
      const authorization = error.config?.headers?.Authorization || error.config?.headers?.authorization;
      const token = getAccessToken();
      if (error.response?.status === 401 && token && authorization === `Bearer ${token}`
          && !error.config?.url?.includes('/api/auth/login')) logout();
      return Promise.reject(error);
    });
    return () => {
      active = false;
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  useEffect(() => {
    const expiry = tokenClaims(getAccessToken())?.exp;
    if (!user || !expiry) return;
    const timer = setTimeout(logout, Math.max(0, Math.min(expiry * 1000 - Date.now(), 2147483647)));
    return () => clearTimeout(timer);
  }, [user, logout]);

  return <AuthContext.Provider value={{ user, authLoading, login, logout }}>{children}</AuthContext.Provider>;
};
