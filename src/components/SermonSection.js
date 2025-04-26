// src/components/SermonSection.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SermonSection.css';
import { useNavigate } from 'react-router-dom';


const SermonSection = () => {
  const [sermons, setSermons] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8080/api/sermons')
      .then(res => setSermons(res.data.content))
      .catch(err => console.error(err));
  }, []);

const navigate = useNavigate();

  return (
    <section className="sermon-section">
      <h2>설교 · 찬양</h2>
      <div className="sermon-list">
        {sermons
          .sort((a, b) => b.id - a.id)
          .slice(0, 3)
          .map(sermon => (
            <div
              key={sermon.id}
              className="sermon-card"
              onClick={() => navigate(`/sermons/${sermon.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="sermon-thumbnail">
                <img src={`https://img.youtube.com/vi/${extractYoutubeId(sermon.youtubeUrl)}/0.jpg`} alt={sermon.title} />
              </div>
              <div className="sermon-meta">
                <span className="category">말씀</span>
                <h3>{sermon.title}</h3>
                {sermon.bibleText && <p className="subtitle">{sermon.bibleText}</p>}
                <p className="preacher">{sermon.preacher} · 일시 {sermon.sermonDate}</p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

function extractYoutubeId(url) {
  const regex = /(?:\?v=|\/embed\/|\/watch\?v=|youtu.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : '';
}

export default SermonSection;