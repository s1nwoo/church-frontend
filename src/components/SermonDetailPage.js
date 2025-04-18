// 📄 src/components/SermonDetailPage.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function SermonDetailPage() {
  const { id } = useParams();
  const [sermon, setSermon] = useState(null);

  useEffect(() => {
    axios.get(`/api/sermons/${id}`, { withCredentials: true })
      .then(res => setSermon(res.data))
      .catch(err => {
        console.error('상세 정보 조회 실패', err);
        alert('해당 설교 영상을 찾을 수 없습니다.');
      });
  }, [id]);

  if (!sermon) return <div>로딩 중...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <h2>{sermon.title}</h2>
      <p><strong>설교자:</strong> {sermon.preacher}</p>
      <p><strong>본문:</strong> {sermon.bibleText}</p>
      <p><strong>설교일:</strong> {sermon.sermonDate}</p>
      <p><strong>내용:</strong></p>
      <p>{sermon.content}</p>

      <div style={{ marginTop: '2rem' }}>
        <iframe
          width="100%"
          height="400"
          src={`https://www.youtube.com/embed/${extractYoutubeId(sermon.youtubeUrl)}`}
          title="YouTube video"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  );
}

// 🔧 유튜브 URL에서 영상 ID 추출
function extractYoutubeId(url) {
  const match = url.match(/(?:youtu\.be\/|v=)([^\&\?\/]+)/);
  return match ? match[1] : '';
}

export default SermonDetailPage;
