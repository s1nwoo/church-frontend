import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // ✅ useNavigate 추가
import axios from 'axios';

function SermonListPage() {
  const [sermons, setSermons] = useState([]);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('userRole') === 'ADMIN'; // ✅ 관리자 여부 확인

  useEffect(() => {
    axios
      .get('/api/sermons')
      .then(res => setSermons(res.data.content))
      .catch(err => console.error('설교 영상 목록 불러오기 실패', err));
  }, []);

  const getYoutubeThumbnail = (url) => {
    const id = extractYoutubeId(url);
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  };

  const extractYoutubeId = (url) => {
    if (!url) return '';
    if (url.length === 11) return url;
    const match = url.match(/[?&]v=([^&#]+)/);
    return match ? match[1] : url;
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📺 설교 영상 목록</h2>

      {isAdmin && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => navigate('/admin/sermons/new')}>
            ➕ 설교 영상 등록
          </button>
        </div>
      )}

      {sermons.length === 0 ? (
        <p>등록된 설교 영상이 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {sermons.map(sermon => (
            <Link
              key={sermon.id}
              to={`/sermons/${sermon.id}`}
              style={{
                border: '1px solid #ccc',
                borderRadius: '10px',
                padding: '1rem',
                textDecoration: 'none',
                color: 'black'
              }}
            >
              <img
                src={getYoutubeThumbnail(sermon.youtubeUrl)}
                alt="썸네일"
                style={{ width: '100%', borderRadius: '10px' }}
              />
              <h3 style={{ margin: '0.5rem 0' }}><Link to={`/sermons/${sermon.id}`}>{sermon.title}</Link></h3>
              <p>{sermon.preacher} / {sermon.sermonDate}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default SermonListPage;
