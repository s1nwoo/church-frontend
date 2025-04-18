// 📄 src/components/SermonCreatePage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SermonCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    preacher: '',
    sermonDate: '',
    youtubeUrl: '',
    bibleText: '',
    content: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/sermons', form, { withCredentials: true });
      alert('설교 영상이 등록되었습니다.');
      navigate('/sermons');
    } catch (err) {
      console.error('등록 실패', err);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h2>📝 설교 영상 등록</h2>
      <form onSubmit={handleSubmit}>
        <label>제목</label>
        <input type="text" name="title" value={form.title} onChange={handleChange} required />

        <label>설교자</label>
        <input type="text" name="preacher" value={form.preacher} onChange={handleChange} required />

        <label>설교 날짜</label>
        <input type="date" name="sermonDate" value={form.sermonDate} onChange={handleChange} required />

        <label>YouTube URL 또는 ID</label>
        <input type="text" name="youtubeUrl" value={form.youtubeUrl} onChange={handleChange} required />

        <label>본문 (예: 골로새서 3:15)</label>
        <input type="text" name="bibleText" value={form.bibleText} onChange={handleChange} />

        <label>설명</label>
        <textarea name="content" value={form.content} onChange={handleChange} rows={4} />

        <button type="submit" style={{ marginTop: '1rem' }}>등록</button>
      </form>
    </div>
  );
}

export default SermonCreatePage;
