import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PostEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    writer: '',
    content: ''
  });

  // 기존 게시글 데이터 로딩
  useEffect(() => {
    axios.get(`/api/posts/${id}`)
      .then(res => setForm(res.data))
      .catch(() => {
        alert('존재하지 않는 게시글입니다.');
        navigate('/');
      });
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`/api/posts/${id}/update`, form)
      .then(() => {
        alert('수정되었습니다!');
        navigate(`/posts/${id}`);
      })
      .catch(() => {
        alert('수정에 실패했습니다.');
      });
  };

  return (
    <div className="container mt-4">
      <h2>✏️ 게시글 수정</h2>
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
          <textarea className="form-control" name="content" rows="6" value={form.content} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary">수정 완료</button>
      </form>
    </div>
  );
};

export default PostEdit;
