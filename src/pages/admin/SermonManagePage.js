// src/pages/admin/SermonManagePage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SermonManagePage.css';

const initialForm = {
  title: '',
  preacher: '',
  sermonDate: '',
  bibleText: '',
  youtubeUrl: '',
  content: '',
};

const fieldLabels = {
  title: '제목',
  preacher: '설교자',
  sermonDate: '설교 날짜',
  bibleText: '본문',
  youtubeUrl: 'YouTube 링크',
  content: '설명',
};

const SermonManagePage = () => {
  const [sermons, setSermons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
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
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (sermon) => {
    setEditing(sermon.id);
    // Convert date to yyyy-MM-dd if needed
    setForm({
      ...sermon,
      sermonDate: sermon.sermonDate,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(initialForm);
  };

  const handleSubmit = async () => {
    // 필수 항목 검사
    const required = ['title', 'preacher', 'sermonDate', 'youtubeUrl'];
    for (const key of required) {
      if (!form[key]) {
        alert(`${fieldLabels[key]}을(를) 입력해주세요.`);
        return;
      }
    }

    try {
      if (editing) {
        await axios.put(`/api/sermons/${editing}`, form);
      } else {
        await axios.post('/api/sermons', form);
      }
      closeModal();
      fetchSermons();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || '저장 중 오류 발생';
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/api/sermons/${id}`);
      fetchSermons();
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류 발생');
    }
  };

  return (
    <div className="sermon-manage-container">
      <h2>설교 관리</h2>

      <div className="sermon-manage-top">
        <input
          type="text"
          placeholder="제목 또는 설교자 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={fetchSermons}>검색</button>
        <button onClick={openCreateModal} className="create-btn">등록</button>
      </div>

      <table className="sermon-table">
        <thead>
          <tr>
            <th>제목</th>
            <th>설교자</th>
            <th>날짜</th>
            <th>본문</th>
            <th>삭제 여부</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {sermons.map((s) => (
            <tr key={s.id} className={s.deleted ? 'deleted-row' : ''}>
              <td>{s.title}</td>
              <td>{s.preacher}</td>
              <td>{s.sermonDate}</td>
              <td>{s.bibleText}</td>
              <td>{s.deleted ? '삭제됨' : '-'}</td>
              <td>
                <button onClick={() => openEditModal(s)}>수정</button>
                <button onClick={() => handleDelete(s.id)} className="delete-btn">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editing ? '설교 수정' : '설교 등록'}</h3>
            {Object.entries(form).map(([key, value]) => {
              const commonProps = {
                key,
                value,
                onChange: (e) => setForm({ ...form, [key]: e.target.value }),
              };
              return key === 'sermonDate' ? (
                <input
                  {...commonProps}
                  type="date"
                  placeholder={fieldLabels[key]}
                />
              ) : (
                <input
                  {...commonProps}
                  type="text"
                  placeholder={fieldLabels[key]}
                />
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
