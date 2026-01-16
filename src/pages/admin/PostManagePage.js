// src/pages/admin/PostManagePage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './PostManagePage.css';

// 카테고리 옵션 정의
const CATEGORY_OPTIONS = [
  { value: '공지사항', label: '공지사항' },
  { value: '성도소식', label: '성도소식' },
  { value: '간증', label: '간증' },
];

// 필드 설정
const fieldConfig = [
  { key: 'title',        label: '제목',        type: 'text',     editable: true, required: true },
  { key: 'category',     label: '카테고리',    type: 'select',   editable: true, required: true,
    options: CATEGORY_OPTIONS },
  { key: 'writer',       label: '작성자',      type: 'text',     editable: true, required: true },
  { key: 'content',      label: '내용',        type: 'textarea', editable: true, required: true },
  {
    key: 'deleted',      label: '삭제 여부',   type: 'select',   editable: true,
    options: [
      { value: false, label: '아니요' },
      { value: true,  label: '예' },
    ]
  },
  { key: 'createdDate',  label: '생성날짜',    type: 'text',     editable: false },
  { key: 'updatedDate',  label: '수정날짜',    type: 'text',     editable: false },
  { key: 'deletedDate',  label: '삭제날짜',    type: 'text',     editable: false },
];

const PostManagePage = () => {
  const [posts, setPosts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const params = {
        keyword: search,
        category: categoryFilter || '공지사항',
        page: 0,
        size: 1000
      };
      const res = await axios.get('/api/posts', { params });
      setPosts(res.data.content || []);
    } catch (err) {
      console.error(err);
      alert('목록 조회 중 오류 발생');
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      category: '공지사항',
      writer: '관리자',
      content: '',
      deleted: false,
      createdDate: '',
      updatedDate: '',
      deletedDate: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (post) => {
    setEditingId(post.id);
    setForm({ ...post });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({});
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // 필수 필드 검사
    const requiredFields = fieldConfig.filter(f => f.required);
    for (const field of requiredFields) {
      if (!form[field.key]) {
        alert(`${field.label}을(를) 입력해주세요.`);
        return;
      }
    }

    try {
      if (editingId) {
        await axios.put(`/api/posts/${editingId}`, form);
      } else {
        await axios.post('/api/posts', form);
      }
      closeModal();
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '저장 중 오류 발생');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/api/posts/${id}`);
      fetchPosts();
    } catch {
      alert('삭제 중 오류 발생');
    }
  };

  return (
    <div className="post-manage-container page-container">
      <h2 className="post-title">소식 관리</h2>

      <div className="post-manage-top">
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="category-filter"
        >
          <option value="">전체 카테고리</option>
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="제목 또는 내용 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={fetchPosts}>검색</button>
        <button onClick={openCreateModal} className="create-btn">등록</button>
      </div>

      <table className="post-table">
        <thead>
          <tr>
            <th>제목</th><th>카테고리</th><th>작성자</th><th>작성일</th>
            <th>삭제 여부</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(p => (
            <tr key={p.id} className={p.deleted ? 'deleted-row' : ''}>
              <td>{p.title}</td>
              <td>{p.category}</td>
              <td>{p.writer}</td>
              <td>{p.createdDate ? new Date(p.createdDate).toLocaleDateString('ko-KR') : ''}</td>
              <td>{p.deleted ? '예' : '아니요'}</td>
              <td>
                <button onClick={() => openEditModal(p)} className="update-btn">수정</button>
                <button onClick={() => handleDelete(p.id)} className="delete-btn">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingId ? '소식 수정' : '소식 등록'}</h3>

            {fieldConfig.map(({ key, label, type, editable, options, required }) => {
              if (key === 'id') return null;

              const common = {
                id: key,
                value: form[key] ?? '',
                onChange: e => {
                  const val = type === 'select'
                    ? e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value
                    : e.target.value;
                  handleChange(key, val);
                },
                disabled: !editable
              };

              return (
                <div className="form-group" key={key}>
                  <label htmlFor={key}>
                    {label}
                    {required && <span className="required">*</span>}
                  </label>
                  {type === 'select' ? (
                    <select {...common}>
                      {options.map(opt => (
                        <option
                          key={String(opt.value)}
                          value={String(opt.value)}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : type === 'textarea' ? (
                    <textarea
                      {...common}
                      rows="10"
                      placeholder={
                        key === 'content' ? '내용을 입력하세요' : ''
                      }
                    />
                  ) : (
                    <input
                      {...common}
                      type={type}
                      placeholder={
                        key === 'title' ? '제목을 입력하세요' :
                        key === 'writer' ? '작성자 이름' :
                        ''
                      }
                    />
                  )}
                </div>
              );
            })}

            <div className="modal-actions">
              <button onClick={handleSubmit} className="save-btn">저장</button>
              <button onClick={closeModal} className="cancel-btn">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManagePage;