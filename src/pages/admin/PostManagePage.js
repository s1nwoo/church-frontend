// src/pages/admin/PostManagePage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './PostManagePage.css';
import AdminBackButton from '../../components/AdminBackButton';
import PostAttachments, { fileSize } from '../../components/PostAttachments';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` });

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
  { key: 'content',      label: '내용',        type: 'textarea', editable: true, required: false },
  {
    key: 'adminOnly',      label: '공개 범위',   type: 'select',   editable: true,
    options: [
      { value: false, label: '전체 공개' },
      { value: true,  label: '관리자만 보기' },
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
  const [visibility, setVisibility] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [files, setFiles] = useState([]);
  const [removeIds, setRemoveIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const params = {
        keyword: search,
        category: categoryFilter,
        ...(visibility !== '' ? { adminOnly: visibility === 'true' } : {}),
        page,
        size: 50
      };
      const res = await axios.get('/api/admin/posts', { params, headers: headers() });
      setPosts(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      console.error(err);
      setError('목록을 불러오지 못했습니다. 관리자 로그인 상태를 확인해 주세요.');
    }
  }, [search, categoryFilter, visibility, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const openCreateModal = (adminOnly = false) => {
    setFiles([]); setRemoveIds([]); setError('');
    setEditingId(null);
    setForm({
      title: '',
      category: '공지사항',
      writer: '관리자',
      content: '',
      deleted: false,
      adminOnly,
      createdDate: '',
      updatedDate: '',
      deletedDate: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (post) => {
    setFiles([]); setRemoveIds([]); setError('');
    setEditingId(post.id);
    setForm({ ...post });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setFiles([]); setRemoveIds([]); setError('');
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

    const kept = (form.attachments || []).filter(a => !removeIds.includes(a.id));
    if (kept.length + files.length > 10) { setError('첨부파일은 최대 10개입니다.'); return; }
    if (files.some(f => !f.size || f.size > 100 * 1024 * 1024)) { setError('각 파일은 0바이트 초과, 100MB 이하여야 합니다.'); return; }
    if (files.reduce((sum, f) => sum + f.size, 0) > 300 * 1024 * 1024) { setError('한 번에 총 300MB까지 업로드할 수 있습니다.'); return; }
    setSaving(true); setError('');
    try {
      const payload = new FormData();
      payload.append('post', new Blob([JSON.stringify({ title: form.title, category: form.category,
        writer: form.writer, content: form.content, adminOnly: !!form.adminOnly })], { type: 'application/json' }));
      files.forEach(file => payload.append('files', file));
      if (editingId) {
        payload.append('removeAttachmentIds', new Blob([JSON.stringify(removeIds)], { type: 'application/json' }));
        await axios.put(`/api/admin/posts/${editingId}`, payload, { headers: headers() });
      } else {
        await axios.post('/api/admin/posts', payload, { headers: headers() });
      }
      setModalOpen(false); setForm({}); setFiles([]); setRemoveIds([]);
      fetchPosts();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '저장하지 못했습니다. 파일 크기와 로그인 상태를 확인해 주세요.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('게시글과 서버에 저장된 모든 첨부파일을 삭제하시겠습니까? 관리자 전용 글과 첨부파일은 복구할 수 없습니다.')) return;
    try {
      await axios.delete(`/api/posts/${id}`, { headers: headers() });
      fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || '삭제를 완료하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="post-manage-container page-container">
      <AdminBackButton />
      <h2 className="post-title">소식 관리</h2>
      <p className="post-admin-help">예배자료는 ‘관리자 자료 올리기’로 보관하세요. 관리자 계정만 조회·다운로드할 수 있으며, 삭제하면 실제 첨부파일도 삭제됩니다.</p>
      {error && !modalOpen && <p role="alert" className="post-admin-error">{error}</p>}

      <div className="post-manage-top">
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
          className="category-filter"
        >
          <option value="">전체 카테고리</option>
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select aria-label="공개 범위 필터" value={visibility} onChange={e => { setVisibility(e.target.value); setPage(0); }}>
          <option value="">모든 공개 범위</option><option value="true">관리자만 보기</option><option value="false">전체 공개</option>
        </select>
        <input
          type="text"
          placeholder="제목 또는 내용 검색"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
        <button onClick={fetchPosts}>검색</button>
        <button onClick={() => openCreateModal(false)} className="create-btn">등록</button>
        <button onClick={() => openCreateModal(true)}>관리자 자료 올리기</button>
      </div>

      <table className="post-table">
        <thead>
          <tr>
            <th>제목</th><th>카테고리</th><th>작성자</th><th>작성일</th>
            <th>공개 범위</th><th>첨부파일</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(p => (
            <tr key={p.id} className={p.deleted ? 'deleted-row' : ''}>
              <td>{p.title}</td>
              <td>{p.category}</td>
              <td>{p.writer}</td>
              <td>{p.createdDate ? new Date(p.createdDate).toLocaleDateString('ko-KR') : ''}</td>
              <td><span className={p.adminOnly ? 'post-private-badge' : ''}>{p.adminOnly ? '관리자만 보기' : '전체 공개'}</span></td>
              <td><PostAttachments post={p} onError={setError} /></td>
              <td>
                <button onClick={() => openEditModal(p)} className="update-btn">수정</button>
                <button onClick={() => handleDelete(p.id)} className="delete-btn">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="post-admin-pages"><button disabled={page === 0} onClick={() => setPage(v => v - 1)}>이전 페이지</button>
        <span>{page + 1} / {Math.max(1, totalPages)}</span><button disabled={page + 1 >= totalPages} onClick={() => setPage(v => v + 1)}>다음 페이지</button></div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="post-modal-title">
            <h3 id="post-modal-title">{editingId ? '소식 수정' : form.adminOnly ? '관리자 자료 등록' : '소식 등록'}</h3>
            {error && <p role="alert" className="post-admin-error">{error}</p>}
            <fieldset disabled={saving} className="post-admin-fields">

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
            <p className="post-admin-help">{form.adminOnly ? '관리자 계정만 글과 첨부파일을 볼 수 있습니다.' : '전체 공개: 글과 첨부파일을 누구나 볼 수 있습니다.'}</p>
            <div className="form-group"><label htmlFor="post-files">첨부파일 (파일당 100MB · 최대 10개 · 한 번에 300MB)</label>
              <input id="post-files" type="file" multiple onChange={e => { setFiles(old => [...old, ...Array.from(e.target.files)]); e.target.value = ''; }} />
              <p className="post-admin-help">저장을 누를 때 업로드됩니다. 취소하면 파일이 서버에 남지 않습니다.</p>
            </div>
            {!!form.attachments?.length && <div><strong>등록된 첨부파일</strong><PostAttachments post={form} onError={setError} />
              {form.attachments.map(file => <label className="post-remove-file" key={file.id}>
                <input type="checkbox" checked={removeIds.includes(file.id)} onChange={e => setRemoveIds(e.target.checked ? [...removeIds, file.id] : removeIds.filter(id => id !== file.id))} />
                {file.filename} 삭제 (저장 시 실제 파일 삭제)</label>)}</div>}
            <ul className="post-pending-files">{files.map((file, index) => <li key={index}>{file.name} ({fileSize(file.size)})
              <button type="button" onClick={() => setFiles(old => old.filter((_, i) => i !== index))}>선택 취소</button></li>)}</ul>
            </fieldset>

            <div className="modal-actions">
              <button onClick={handleSubmit} disabled={saving} className="save-btn">{saving ? '업로드·저장 중…' : '저장'}</button>
              <button onClick={closeModal} disabled={saving} className="cancel-btn">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManagePage;
