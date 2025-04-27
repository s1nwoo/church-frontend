// src/pages/SermonDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const SermonDetailPage = () => {
  const { id } = useParams();
  const [sermon, setSermon] = useState(null);

  useEffect(() => {
    // ⚡️ 절대경로 제거: /api/sermons/${id} 상대경로만 사용
    axios.get(`/api/sermons/${id}`)
      .then(res => setSermon(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!sermon) return <div className="page-container">로딩 중...</div>;

  const extractYoutubeId = (url) => {
    const regex = /(?:\?v=|\/embed\/|\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  return (
    <div className="page-container">
      <h1>{sermon.title}</h1>
      <p><strong>설교자:</strong> {sermon.preacher}</p>
      <p><strong>날짜:</strong> {sermon.sermonDate}</p>
      <p><strong>본문:</strong> {sermon.bibleText}</p>

      <iframe
        width="100%"
        height="400"
        src={`https://www.youtube.com/embed/${extractYoutubeId(sermon.youtubeUrl)}`}
        title="YouTube Sermon"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ margin: '24px 0' }}
      />

      <p>{sermon.content}</p>
    </div>
  );
};

export default SermonDetailPage;
