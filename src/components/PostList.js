import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { isAdminUser } from '../utils/auth';

const PostList = () => {
  const [posts, setPosts] = useState([]);

  const { user } = useContext(AuthContext);

    useEffect(() => {
      axios.get('/api/posts')
        .then(res => {
          const data = res.data;

          // 유연하게 처리: content가 있으면 그걸, 아니면 그냥 배열
          const list = Array.isArray(data.content) ? data.content : (
            Array.isArray(data) ? data : []
          );

          setPosts(list);
        })
        .catch(err => {
          console.error("게시글 목록 오류 발생:", err);
        });
    }, []);

  return (
    <div className="container mt-4">
      <h2>📋 게시글 목록</h2>

      {/* ✍ 관리자만 글쓰기 버튼 표시 */}
      {isAdminUser(user) && (
        <div className="mb-3 text-end">
          <Link to="/posts/new" className="btn btn-primary">✍ 글쓰기</Link>
        </div>
      )}

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
          </tr>
        </thead>
        <tbody>
          {posts.length > 0 ? posts.map(post => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td>
                <Link to={`/posts/${post.id}`}>{post.title}</Link>
              </td>
              <td>{post.writer}</td>
              <td>{new Date(post.createdDate).toLocaleString()}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className="text-center">게시글이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PostList;
