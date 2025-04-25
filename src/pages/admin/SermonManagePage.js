// src/pages/admin/SermonManagePage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SermonManagePage.css';

const fieldConfig = [
  { key: 'title',        label: '제목',        type: 'text',   editable: true },
  { key: 'preacher',     label: '설교자',      type: 'text',   editable: true },
  { key: 'sermonDate',   label: '설교 날짜',   type: 'date',   editable: true },
  { key: 'bibleText',    label: '본문',        type: 'text',   editable: true },
  { key: 'youtubeUrl',   label: '유튜브 링크',type: 'text',   editable: true },
  { key: 'content',      label: '설명',        type: 'text',   editable: true },
  {
    key: 'deleted',      label: '삭제 여부',   type: 'select', editable: true,
    options: [
      { value: false, label: '아니요' },
      { value: true,  label: '예'     },
    ]
  },
  { key: 'createdDate',  label: '생성날짜',    type: 'text',   editable: false },
  { key: 'updatedDate',  label: '수정날짜',    type: 'text',   editable: false },
  { key: 'deletedDate',  label: '삭제날짜',    type: 'text',   editable: false },
];

const SermonManagePage = () => {
  const [sermons, setSermons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');

  const fetchSermons = async () => {
    try {
      const res = await axios.get(`/api/sermons?keyword=${search}&includeDeleted=true`);
      setSermons(res.data.content || []);
    } catch (err) {
      console.error(err);
      alert('목록 조회 중 오류 발생');
    }
  };

   useEffect(() => {
     fetchSermons();
   }, []);

  const openCreateModal = () => {
    setEditingId(null);
    // 서버가 리턴하는 객체 구조에 맞춰 초기화
    setForm({
      title: '', preacher: '', sermonDate: '', bibleText: '',
      youtubeUrl: '', content: '', deleted: false,
      createdDate: '', updatedDate: '', deletedDate: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (sermon) => {
    setEditingId(sermon.id);
    setForm({ ...sermon });
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
    // 필수 검사
    for (const { key, label } of fieldConfig.filter(f => f.editable && ['title','preacher','sermonDate','youtubeUrl'].includes(f.key))) {
      if (!form[key]) {
        alert(`${label}을(를) 입력해주세요.`);
        return;
      }
    }

    try {
      if (editingId) {
        await axios.put(`/api/sermons/${editingId}`, form);
      } else {
        await axios.post('/api/sermons', form);
      }
      closeModal();
      fetchSermons();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '저장 중 오류 발생');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/api/sermons/${id}`);
      fetchSermons();
    } catch {
      alert('삭제 중 오류 발생');
    }
  };

  return (
    <div className="sermon-manage-container page-container">
      <h2 className="sermon-title">설교 관리</h2>

      <div className="sermon-manage-top">
        <input
          type="text"
          placeholder="제목 또는 설교자 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={fetchSermons}>검색</button>
        <button onClick={openCreateModal} className="create-btn">등록</button>
      </div>

      <table className="sermon-table">
        <thead>
          <tr>
            <th>제목</th><th>설교자</th><th>날짜</th><th>본문</th>
            <th>삭제 여부</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {sermons.map(s => (
            <tr key={s.id} className={s.deleted ? 'deleted-row' : ''}>
              <td>{s.title}</td>
              <td>{s.preacher}</td>
              <td>{s.sermonDate}</td>
              <td>{s.bibleText}</td>
              <td>{s.deleted ? '예' : '아니요'}</td>
              <td>
                <button onClick={() => openEditModal(s)} className="update-btn">수정</button>
                <button onClick={() => handleDelete(s.id)} className="delete-btn">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingId ? '설교 수정' : '설교 등록'}</h3>

            {fieldConfig.map(({ key, label, type, editable, options }) => {
              // id 필드 제외
              if (key === 'id') return null;

              const common = {
                id: key,
                value: form[key] ?? '',
                onChange: e => {
                  const val = type === 'select'
                    ? e.target.value === 'true'
                    : e.target.value;
                  handleChange(key, val);
                },
                disabled: !editable
              };

              return (
                <div className="form-group" key={key}>
                  <label htmlFor={key}>{label}</label>
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
                  ) : (
                    <input
                      {...common}
                      type={type}
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

export default SermonManagePage;
