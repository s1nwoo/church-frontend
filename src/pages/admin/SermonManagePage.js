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

// 성경 약어표
const BIBLE_ABBREVIATIONS = [
  { group: '구약 - 모세오경', books: [
    { abbr: '창', name: '창세기' }, { abbr: '출', name: '출애굽기' },
    { abbr: '레', name: '레위기' }, { abbr: '민', name: '민수기' },
    { abbr: '신', name: '신명기' },
  ]},
  { group: '구약 - 역사서', books: [
    { abbr: '수', name: '여호수아' }, { abbr: '삿', name: '사사기' },
    { abbr: '룻', name: '룻기' }, { abbr: '삼상', name: '사무엘상' },
    { abbr: '삼하', name: '사무엘하' }, { abbr: '왕상', name: '열왕기상' },
    { abbr: '왕하', name: '열왕기하' }, { abbr: '대상', name: '역대상' },
    { abbr: '대하', name: '역대하' }, { abbr: '스', name: '에스라' },
    { abbr: '느', name: '느헤미야' }, { abbr: '에', name: '에스더' },
  ]},
  { group: '구약 - 시가서', books: [
    { abbr: '욥', name: '욥기' }, { abbr: '시', name: '시편' },
    { abbr: '잠', name: '잠언' }, { abbr: '전', name: '전도서' },
    { abbr: '아', name: '아가' },
  ]},
  { group: '구약 - 대선지서', books: [
    { abbr: '사', name: '이사야' }, { abbr: '렘', name: '예레미야' },
    { abbr: '애', name: '예레미야애가' }, { abbr: '겔', name: '에스겔' },
    { abbr: '단', name: '다니엘' },
  ]},
  { group: '구약 - 소선지서', books: [
    { abbr: '호', name: '호세아' }, { abbr: '욜', name: '요엘' },
    { abbr: '암', name: '아모스' }, { abbr: '옵', name: '오바댜' },
    { abbr: '욘', name: '요나' }, { abbr: '미', name: '미가' },
    { abbr: '나', name: '나훔' }, { abbr: '합', name: '하박국' },
    { abbr: '습', name: '스바냐' }, { abbr: '학', name: '학개' },
    { abbr: '슥', name: '스가랴' }, { abbr: '말', name: '말라기' },
  ]},
  { group: '신약 - 복음서', books: [
    { abbr: '마', name: '마태복음' }, { abbr: '막', name: '마가복음' },
    { abbr: '눅', name: '누가복음' }, { abbr: '요', name: '요한복음' },
  ]},
  { group: '신약 - 역사서', books: [
    { abbr: '행', name: '사도행전' },
  ]},
  { group: '신약 - 바울서신', books: [
    { abbr: '롬', name: '로마서' }, { abbr: '고전', name: '고린도전서' },
    { abbr: '고후', name: '고린도후서' }, { abbr: '갈', name: '갈라디아서' },
    { abbr: '엡', name: '에베소서' }, { abbr: '빌', name: '빌립보서' },
    { abbr: '골', name: '골로새서' }, { abbr: '살전', name: '데살로니가전서' },
    { abbr: '살후', name: '데살로니가후서' }, { abbr: '딤전', name: '디모데전서' },
    { abbr: '딤후', name: '디모데후서' }, { abbr: '딛', name: '디도서' },
    { abbr: '몬', name: '빌레몬서' },
  ]},
  { group: '신약 - 공동서신', books: [
    { abbr: '히', name: '히브리서' }, { abbr: '약', name: '야고보서' },
    { abbr: '벧전', name: '베드로전서' }, { abbr: '벧후', name: '베드로후서' },
    { abbr: '요일', name: '요한일서' }, { abbr: '요이', name: '요한이서' },
    { abbr: '요삼', name: '요한삼서' }, { abbr: '유', name: '유다서' },
    { abbr: '계', name: '요한계시록' },
  ]},
];

// 필드 설정: content를 메인 제목으로 사용 (title 제거)
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

const PAGE_SIZE = 10; // 한 페이지에 보여줄 설교 수

const SermonManagePage = () => {
  const [sermons, setSermons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');

  // 페이지네이션 상태
  const [page, setPage] = useState(0);           // 현재 페이지(0-based)
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 설교자 직접입력 모드 상태
  const [isCustomPreacher, setIsCustomPreacher] = useState(false);
  const [customPreacherValue, setCustomPreacherValue] = useState('');
  // 성경 약어표 툴팁 표시 상태
  const [showBibleTooltip, setShowBibleTooltip] = useState(false);
  const bibleTooltipRef = React.useRef(null);

  // 툴팁 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bibleTooltipRef.current && !bibleTooltipRef.current.contains(e.target)) {
        setShowBibleTooltip(false);
      }
    };
    if (showBibleTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBibleTooltip]);

  const fetchSermons = useCallback(async (targetPage = 0) => {
    try {
      const res = await axios.get('/api/sermons', {
        params: {
          keyword: search,
          page: targetPage,
          size: PAGE_SIZE,
          includeDeleted: true,
        },
      });
      setSermons(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      // 서버가 응답한 실제 페이지 번호로 동기화 (범위를 벗어난 요청 대비)
      setPage(res.data.number ?? targetPage);
    } catch (err) {
      console.error(err);
      alert('목록 조회 중 오류 발생');
    }
  }, [search]);

  // 검색어 변경 시 첫 페이지부터 다시 조회
  useEffect(() => {
    fetchSermons(0);
  }, [fetchSermons]);

  const openCreateModal = () => {
    setEditingId(null);
    // title 제거 - content를 메인 제목으로 사용
    setForm({
      content: '',
      preacher: '김성휘 목사님',
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
      setIsCustomPreacher(true);
      setCustomPreacherValue(preacherValue);
      setForm(prev => ({ ...prev, preacher: preacherValue }));
    } else {
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
      // title 제거 - content만 전송
      const submitData = { ...form };

      if (editingId) {
        await axios.put(`/api/sermons/${editingId}`, submitData);
        closeModal();
        fetchSermons(page);      // 수정: 현재 페이지 유지
      } else {
        await axios.post('/api/sermons', submitData);
        closeModal();
        fetchSermons(0);         // 등록: 최신 항목이 보이는 첫 페이지로
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '저장 중 오류 발생');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/api/sermons/${id}`);
      fetchSermons(page);   // 소프트 삭제라 목록에 남음 → 현재 페이지 유지
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
        <button onClick={() => fetchSermons(0)}>검색</button>
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
              {/* title → content 변경 */}
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

      {/* ─── 페이지네이션 ─── */}
      {totalPages > 1 && (() => {
        const WINDOW = 5;
        let start = Math.max(0, page - Math.floor(WINDOW / 2));
        let end = Math.min(totalPages, start + WINDOW);
        start = Math.max(0, end - WINDOW);
        const pageNumbers = [];
        for (let p = start; p < end; p++) pageNumbers.push(p);

        return (
          <div className="sermon-pagination">
            <button
              className="page-btn"
              onClick={() => fetchSermons(0)}
              disabled={page === 0}
            >«</button>
            <button
              className="page-btn"
              onClick={() => fetchSermons(page - 1)}
              disabled={page === 0}
            >이전</button>

            {pageNumbers.map(p => (
              <button
                key={p}
                className={`page-btn${p === page ? ' active' : ''}`}
                onClick={() => fetchSermons(p)}
              >
                {p + 1}
              </button>
            ))}

            <button
              className="page-btn"
              onClick={() => fetchSermons(page + 1)}
              disabled={page >= totalPages - 1}
            >다음</button>
            <button
              className="page-btn"
              onClick={() => fetchSermons(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >»</button>

            <span className="page-info">
              {page + 1} / {totalPages} 페이지 (총 {totalElements}건)
            </span>
          </div>
        );
      })()}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingId ? '설교 수정' : '설교 등록'}</h3>

            {fieldConfig.map(({ key, label, type, editable, options, required }) => {
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
                    {/* 성경봉독 필드에만 ? 툴팁 버튼 표시 */}
                    {key === 'bibleText' && (
                      <span
                        className={`bible-tooltip-trigger${showBibleTooltip ? ' active' : ''}`}
                        onClick={() => setShowBibleTooltip(prev => !prev)}
                        ref={bibleTooltipRef}
                      >
                        ?
                        {showBibleTooltip && (
                          <div className="bible-tooltip">
                            <p className="bible-tooltip-title">📖 성경 약어표</p>
                            <p className="bible-tooltip-usage">입력 예: 요3:16 / 삼하6:1-10 / 요3:16, 롬8:28</p>
                            {BIBLE_ABBREVIATIONS.map(group => (
                              <div key={group.group} className="bible-tooltip-group">
                                <p className="bible-tooltip-group-title">{group.group}</p>
                                <div className="bible-tooltip-books">
                                  {group.books.map(book => (
                                    <span key={book.abbr} className="bible-tooltip-book">
                                      <strong>{book.abbr}</strong> {book.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </span>
                    )}
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