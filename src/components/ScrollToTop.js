import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // ✅ 바로 최상단으로 이동 (부드럽지 않게)
  }, [pathname]);

  return null;
}

export default ScrollToTop;
