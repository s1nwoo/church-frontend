// src/pages/admin/SermonManagePage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './SermonManagePage.css';

// 설교자 옵션 정의
const PREACHER_OPTIONS = [
  { value: '김성휘 목사님', label: '김성휘 목사님' },
  { value: '임주빈 목사님', label: '임주빈 목사님' },
  { value: 'custom', label: '직접입력' }
];

// 필드 설정: content를 메인 제목으로, title은 자동 생성
const fieldConfig = [
  { key: 'content',      label: '말씀 제목',    type: 'text',   editable: true, required: true },
  { key: 'preacher',     label: '설교자',       type: 'preacher-select', editable: true, required: true },
  { key: 'sermonDate',   label: '설교 날짜',    type: 'date',   editable: true, required: true },
  { key: 'youtubeUrl',   label: '유튜브 링크',  type: 'text',   editable: true, required: true },
  { key: 'bibleText',    label: '성경봉독',     type: 'text',   editable: true, required: false },
  {
    key: 'deleted',      label: '삭제 여부',    type: 'select', editable: true,
    options: [
      { value: false, label: '아니요' },
      { value: true,  label: '예'     },
    ]
  },
  { key: 'createdDate',  label: '생성날짜',     type: 'text',   editable: false },
  { key: 'updatedDate',  label: '수정날짜',     type: 'text',   editable: false },
  { key: 'deletedDate',  label: '삭제날짜',     type: 'text',   editable: false },
];

const SermonManagePage = () => {
  const [sermons, setSermons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');

  // 설교자 직접입력 모드 상태
  const [isCustomPreacher, setIsCustomPreacher] = useState(false);
  const [customPreacherValue, setCustomPreacherValue] = useState('');

  const fetchSermons = useCallback(async () => {
    try {
      const res = await axios.get(`/api/sermons?keyword=${search}&includeDeleted=true`);
      setSermons(res.data.content || []);
    } catch (err) {
      console.error(err);
      alert('목록 조회 중 오류 발생');
    }
  }, [search]);

  useEffect(() => {
    fetchSermons();
  }, [fetchSermons]);

  const openCreateModal = () => {
    setEditingId(null);
    // 초기화: title은 비워두고, content를 메인으로 사용
    setForm({
      title: '',
      content: '',  // 말씀 제목
      preacher: '김성휘 목사님',  // 기본값
      sermonDate: '',
      bibleText: '',
      youtubeUrl: '',
      deleted: false,
      createdDate: '',
      updatedDate: '',
      deletedDate: ''
    });
    setIsCustomPreacher(false);
    setCustomPreacherValue('');
    setModalOpen(true);
  };

  const openEditModal = (sermon) => {
    setEditingId(sermon.id);
    setForm({ ...sermon });

    // 수정 시 설교자가 미리 정의된 옵션에 없으면 직접입력 모드로
    const preacherValue = sermon.preacher || '';
    const isPresetPreacher = PREACHER_OPTIONS.some(opt =>
      opt.value !== 'custom' && opt.value === preacherValue
    );

    if (!isPresetPreacher && preacherValue) {
      // 직접입력된 설교자인 경우
      setIsCustomPreacher(true);
      setCustomPreacherValue(preacherValue);
      setForm(prev => ({ ...prev, preacher: preacherValue }));
    } else {
      // 미리 정의된 설교자인 경우
      setIsCustomPreacher(false);
      setCustomPreacherValue('');
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({});
    setIsCustomPreacher(false);
    setCustomPreacherValue('');
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // 설교자 선택 변경 핸들러
  const handlePreacherChange = (value) => {
    if (value === 'custom') {
      setIsCustomPreacher(true);
      setCustomPreacherValue('');
      setForm(prev => ({ ...prev, preacher: '' }));
    } else {
      setIsCustomPreacher(false);
      setCustomPreacherValue('');
      setForm(prev => ({ ...prev, preacher: value }));
    }
  };

  // 직접입력 설교자명 변경 핸들러
  const handleCustomPreacherChange = (value) => {
    setCustomPreacherValue(value);
    setForm(prev => ({ ...prev, preacher: value }));
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

    // 직접입력 모드에서 설교자명이 비어있는지 체크
    if (isCustomPreacher && !customPreacherValue.trim()) {
      alert('설교자 이름을 입력해주세요.');
      return;
    }

    try {
      // title을 content(말씀 제목)와 동일하게 설정
      const submitData = {
        ...form,
        title: form.content  // title = content (말씀 제목)
      };

      if (editingId) {
        await axios.put(`/api/sermons/${editingId}`, submitData);
      } else {
        await axios.post('/api/sermons', submitData);
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
          placeholder="말씀 제목 또는 설교자 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={fetchSermons}>검색</button>
        <button onClick={openCreateModal} className="create-btn">등록</button>
      </div>

      <table className="sermon-table">
        <thead>
          <tr>
            <th>말씀 제목</th><th>설교자</th><th>날짜</th><th>성경봉독</th>
            <th>삭제 여부</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {sermons.map(s => (
            <tr key={s.id} className={s.deleted ? 'deleted-row' : ''}>
              <td>{s.content}</td>
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

            {fieldConfig.map(({ key, label, type, editable, options, required }) => {
              // id, title 필드는 모달에 표시하지 않음 (title은 자동 생성)
              if (key === 'id' || key === 'title') return null;

              // 설교자 필드: 특별 처리
              if (key === 'preacher') {
                return (
                  <div className="form-group" key={key}>
                    <label htmlFor={key}>
                      {label}
                      {required && <span className="required">*</span>}
                    </label>
                    <select
                      id={key}
                      value={isCustomPreacher ? 'custom' : (form[key] || '')}
                      onChange={e => handlePreacherChange(e.target.value)}
                      disabled={!editable}
                    >
                      {PREACHER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {isCustomPreacher && (
                      <input
                        type="text"
                        placeholder="설교자 이름을 입력하세요"
                        value={customPreacherValue || form[key] || ''}
                        onChange={e => handleCustomPreacherChange(e.target.value)}
                        style={{ marginTop: '8px' }}
                        autoFocus
                      />
                    )}
                  </div>
                );
              }

              // 공통 input 속성
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
                      rows="4"
                      placeholder="추가 설명이 필요한 경우 입력하세요"
                    />
                  ) : (
                    <input
                      {...common}
                      type={type}
                      placeholder={
                        key === 'youtubeUrl' ? 'https://www.youtube.com/watch?v=...' :
                        key === 'bibleText' ? '예: 요3:16 또는 요3:16-21 또는 요3:16, 요5:14-15' :
                        key === 'content' ? '말씀의 제목을 입력하세요' :
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

export default SermonManagePage;