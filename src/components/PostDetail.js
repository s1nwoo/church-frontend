import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PostDetail = () => {
  const { id } = useParams(); // URL 경로에서 ID 추출
  const [post, setPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/posts/${id}`)
      .then(res => setPost(res.data))
      .catch(err => {
        console.error('게시글 불러오기 실패:', err);
        alert('존재하지 않는 게시글입니다.');
        navigate('/');
      });
  }, [id, navigate]);

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      axios.delete(`/api/posts/${id}`)
        .then(() => {
          alert('삭제되었습니다.');
          navigate('/');
        })
        .catch(() => {
          alert('삭제에 실패했습니다.');
        });
    }
  };

  if (!post) return <div className="container mt-4">로딩 중...</div>;

  return (
    <div className="container mt-4">
      <h2>📄 게시글 상세</h2>
      <table className="table">
        <tbody>
          <tr><th>제목</th><td>{post.title}</td></tr>
          <tr><th>작성자</th><td>{post.writer}</td></tr>
          <tr><th>작성일</th><td>{new Date(post.createdDate).toLocaleString()}</td></tr>
          <tr><th>내용</th><td style={{ whiteSpace: 'pre-line' }}>{post.content}</td></tr>
        </tbody>
      </table>

      <div className="text-end">
        <button className="btn btn-outline-danger me-2" onClick={handleDelete}>삭제</button>
        <button className="btn btn-outline-primary" onClick={() => navigate(`/posts/${id}/edit`)}>수정</button>
      </div>
    </div>
  );
};

export default PostDetail;
