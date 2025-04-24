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

const SermonManagePage = () => {
  const [sermons, setSermons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // id or null
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');

  const fetchSermons = async () => {
    const res = await axios.get(`/api/sermons?keyword=${search}`);
    setSermons(res.data.content || []);
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
    setForm(sermon);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(initialForm);
  };

  const handleSubmit = async () => {
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
      alert('저장 중 오류 발생');
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
    <div className="sermon-manage-container page-container">
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
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {sermons.map((s) => (
            <tr key={s.id}>
              <td>{s.title}</td>
              <td>{s.preacher}</td>
              <td>{s.sermonDate}</td>
              <td>{s.bibleText}</td>
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
            {Object.entries(form).map(([key, value]) => (
              <input
                key={key}
                type="text"
                placeholder={key}
                value={value}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ))}
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
