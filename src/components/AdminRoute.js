import React, { useContext } from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { isAdminUser } from '../utils/auth';

export default function AdminRoute() {
  const { user } = useContext(AuthContext);
  if (!user || !localStorage.getItem('accessToken')) {
    return <Navigate to="/login" replace state={{ adminLogin: true }} />;
  }
  if (!isAdminUser(user)) {
    return <main className="page-container"><h1>관리자 권한이 필요합니다.</h1>
      <p>관리자 계정으로 로그인해 주세요.</p>
      <Link to="/login" state={{ adminLogin: true }}>관리자 로그인</Link>
    </main>;
  }
  return <Outlet />;
}
