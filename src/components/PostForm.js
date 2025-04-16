import React, { useState } from 'react';
import axios from 'axios';

const PostForm = () => {
  const [form, setForm] = useState({
    title: '',
    writer: '',
    content: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post('/api/posts', form, { withCredentials: true })
      .then(response => {
        alert('게시글이 등록되었습니다!');
        window.location.href = '/';
      })
      .catch(error => {
        console.error('등록 실패:', error);
        alert('등록에 실패했습니다.');
      });
  };

  return (
    <div className="container mt-4">
      <h2>✏️ 게시글 작성</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>제목</label>
          <input type="text" className="form-control" name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label>작성자</label>
          <input type="text" className="form-control" name="writer" value={form.writer} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label>내용</label>
          <textarea className="form-control" rows="8" name="content" value={form.content} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary">등록</button>
      </form>
    </div>
  );
};

export default PostForm;
