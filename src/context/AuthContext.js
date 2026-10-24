// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Restore before route guards render, including on a direct visit or refresh.
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  // 로그인 처리 함수
  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', userData.accessToken);
    setUser(userData);
  };

  // 로그아웃 처리 함수
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken'); // refreshToken도 있다면 제거
    setUser(null);
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(response => response, error => {
      const request = error.config;
      const authorization = request?.headers?.Authorization || request?.headers?.authorization;
      const currentToken = localStorage.getItem('accessToken');
      // An old in-flight request must not clear a newly established login.
      if (error.response?.status === 401 && currentToken && authorization === `Bearer ${currentToken}`
          && !request?.url?.includes('/api/auth/login')) {
        logout();
      }
      return Promise.reject(error);
    });
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
