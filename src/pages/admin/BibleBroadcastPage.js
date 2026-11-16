import React, { useContext, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { isAdminUser } from '../../utils/auth';
import { BibleSlideStudio } from './BiblePptPage';

/**
 * 관리자 메뉴 ‘성경 송출’. 다른 관리자 화면과 달리 들어올 때만 관리자 확인을 한다.
 * 예배 중에 로그인이 끊겨도(만료·다른 탭에서 로그아웃) 로그인 화면으로 넘어가지 않고 송출 화면을 그대로 둔다.
 * 그때는 송출 패널에서 바로 다시 로그인할 수 있다.
 */
export default function BibleBroadcastPage() {
  const { user, authLoading } = useContext(AuthContext);
  const [entered, setEntered] = useState(false);
  const admin = isAdminUser(user);
  if (admin && !entered) setEntered(true);
  if (admin || entered) return <BibleSlideStudio mode="broadcast" />;
  if (authLoading) return <main className="page-container" role="status">로그인 상태를 확인하고 있습니다.</main>;
  if (!user) return <Navigate to="/login" replace state={{ adminLogin: true }} />;
  return <main className="page-container"><h1>관리자 권한이 필요합니다.</h1>
    <p>관리자 계정으로 로그인해 주세요.</p>
    <Link to="/login" state={{ adminLogin: true }}>관리자 로그인</Link>
  </main>;
}
