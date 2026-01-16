// src/pages/admin/MemberManagePage.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './MemberManagePage.css';

// 역할 옵션
const ROLE_OPTIONS = [
  { value: 'USER', label: '일반 회원' },
  { value: 'ADMIN', label: '관리자' },
];

// 성별 옵션
const GENDER_OPTIONS = [
  { value: '남자', label: '남자' },
  { value: '여자', label: '여자' },
];

// 필드 설정
const fieldConfig = [
  { key: 'username',    label: '아이디',      type: 'text',     editable: true,  required: true },
  { key: 'password',    label: '비밀번호',    type: 'password', editable: true,  required: false,
    note: '(수정 시 비워두면 기존 비밀번호 유지)' },
  { key: 'name',        label: '이름',        type: 'text',     editable: true,  required: true },
  { key: 'birthDate',   label: '생년월일',    type: 'text',     editable: true,  required: true,
    placeholder: 'YYYY-MM-DD' },
  { key: 'email',       label: '이메일',      type: 'email',    editable: true,  required: true },
  { key: 'phoneNumber', label: '전화번호',    type: 'tel',      editable: true,  required: false,
    placeholder: '01012345678' },
  { key: 'gender',      label: '성별',        type: 'select',   editable: true,  required: true,
    options: GENDER_OPTIONS },
  { key: 'role',        label: '권한',        type: 'select',   editable: true,  required: true,
    options: ROLE_OPTIONS },
  { key: 'deleted',     label: '삭제 여부',   type: 'select',   editable: true,
    options: [
      { value: false, label: '아니요' },
      { value: true,  label: '예' },
    ]
  },
  { key: 'createdDate', label: '가입일',      type: 'text',     editable: false },
  { key: 'updatedDate', label: '수정일',      type: 'text',     editable: false },
  { key: 'deletedDate', label: '삭제일',      type: 'text',     editable: false },
];

const MemberManagePage = () => {
  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const params = {
        keyword: search,
        includeDeleted: includeDeleted,
        page: 0,
        size: 1000
      };
      const res = await axios.get('/api/admin/users', { params });
      setMembers(res.data.users || []);
    } catch (err) {
      console.error(err);
      alert('목록 조회 중 오류 발생');
    }
  }, [search, includeDeleted]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      username: '',
      password: '',
      name: '',
      birthDate: '',
      email: '',
      phoneNumber: '',
      gender: '남자',
      role: 'USER',
      deleted: false,
      createdDate: '',
      updatedDate: '',
      deletedDate: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingId(member.id);
    setForm({
      ...member,
      password: '' // 비밀번호는 비워둠 (수정 시 선택사항)
    });
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
      if (field.key === 'password' && editingId) continue; // 수정 시 비밀번호 선택사항
      if (!form[field.key]) {
        alert(`${field.label}을(를) 입력해주세요.`);
        return;
      }
    }

    // 신규 등록 시 비밀번호 필수
    if (!editingId && !form.password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/admin/users/${editingId}`, form);
      } else {
        await axios.post('/api/admin/users', form);
      }
      closeModal();
      fetchMembers();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data || '저장 중 오류 발생';
      alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류 발생');
    }
  };

  return (
    <div className="member-manage-container page-container">
      <h2 className="member-title">성도 관리</h2>

      <div className="member-manage-top">
        <label>
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={e => setIncludeDeleted(e.target.checked)}
          />
          삭제된 회원 포함
        </label>
        <input
          type="text"
          placeholder="이름, 아이디, 이메일 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={fetchMembers}>검색</button>
        <button onClick={openCreateModal} className="create-btn">등록</button>
      </div>

      <table className="member-table">
        <thead>
          <tr>
            <th>아이디</th><th>이름</th><th>이메일</th><th>전화번호</th>
            <th>성별</th><th>권한</th><th>가입일</th><th>삭제 여부</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {members.map(m => (
            <tr key={m.id} className={m.deleted ? 'deleted-row' : ''}>
              <td>{m.username}</td>
              <td>{m.name}</td>
              <td>{m.email}</td>
              <td>{m.phoneNumber || '-'}</td>
              <td>{m.gender}</td>
              <td>{m.role === 'ADMIN' ? '관리자' : '일반 회원'}</td>
              <td>{m.createdDate ? new Date(m.createdDate).toLocaleDateString('ko-KR') : ''}</td>
              <td>{m.deleted ? '예' : '아니요'}</td>
              <td>
                <button onClick={() => openEditModal(m)} className="update-btn">수정</button>
                <button onClick={() => handleDelete(m.id)} className="delete-btn">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingId ? '성도 정보 수정' : '성도 등록'}</h3>

            {fieldConfig.map(({ key, label, type, editable, options, required, placeholder, note }) => {
              if (key === 'id') return null;

              const common = {
                id: key,
                value: form[key] ?? '',
                onChange: e => {
                  let val = type === 'select'
                    ? e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value
                    : e.target.value;

                  // ✅ 전화번호 필드는 숫자만 입력 가능
                  if (key === 'phoneNumber') {
                    val = val.replace(/[^0-9]/g, '');
                  }

                  handleChange(key, val);
                },
                disabled: !editable
              };

              return (
                <div className="form-group" key={key}>
                  <label htmlFor={key}>
                    {label}
                    {required && <span className="required">*</span>}
                    {note && <span className="note">{note}</span>}
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
                  ) : (
                    <input
                      {...common}
                      type={type}
                      placeholder={placeholder || ''}
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

export default MemberManagePage;