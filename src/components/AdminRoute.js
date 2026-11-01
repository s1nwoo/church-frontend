import React, { useContext } from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { isAdminUser } from '../utils/auth';
import { getAccessToken } from '../utils/authSession';

export default function AdminRoute() {
  const { user, authLoading } = useContext(AuthContext);
  if (authLoading) return <main className="page-container" role="status">로그인 상태를 확인하고 있습니다.</main>;
  if (!user || !getAccessToken()) {
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
