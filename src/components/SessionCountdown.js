import React, { useEffect, useState } from 'react';

export default function SessionCountdown({ expiresAt }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  const seconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return <span className="session-countdown" role="timer" aria-live="off"
    aria-label={`로그인 남은 시간 ${minutes}분 ${remainder}초`}>
    남은 시간 <time>{String(minutes).padStart(2, '0')}:{String(remainder).padStart(2, '0')}</time>
  </span>;
}
