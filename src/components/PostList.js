// [파일] src/components/PostList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PostList = () => {
  const [posts, setPosts] = useState([]);

  // [기능] 컴포넌트가 마운트될 때 게시글 목록 불러오기
  useEffect(() => {
    axios.get('/api/posts')
      .then(response => {
        setPosts(response.data);
      })
      .catch(error => {
        console.error('게시글을 불러오는 중 오류 발생:', error);
      });
  }, []);

  return (
    <div className="container mt-4">
      <h2>📋 게시글 목록</h2>
      <table className="table table-bordered mt-3">
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
