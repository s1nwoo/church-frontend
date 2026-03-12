// src/pages/admin/CardSliderManagePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './CardSliderManagePage.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// 링크 타입 선택지
const LINK_TYPE_OPTIONS = [
  { value: 'none',     label: '없음 (클릭 무반응)' },
  { value: 'internal', label: '내부 이동 (React 라우터)' },
  { value: 'external', label: '외부 링크 (새 탭)' },
];

// 이미지 경로 자동완성용 기본 카드 이미지
const PRESET_IMAGES = [
  { label: 'card1.png', value: 'images/card/card1.png' },
  { label: 'card2.png', value: 'images/card/card2.png' },
  { label: 'card3.png', value: 'images/card/card3.png' },
  { label: 'card4.png', value: 'images/card/card4.png' },
  { label: 'card5.png', value: 'images/card/card5.png' },
];

// 빈 폼 초기값
const EMPTY_FORM = {
  title: '',
  imageUrl: '',
  linkType: 'none',
  linkUrl: '',
  sortOrder: 1,
  active: true,
};

const CardSliderManagePage = () => {
  const navigate = useNavigate();

  const [cards, setCards]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // 폼 상태 (등록/수정 공통)
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]     = useState(false);

  /* ------------------------------------------------------------------
   * 목록 조회
   * ------------------------------------------------------------------ */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/banner-cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('목록 조회 실패');
      const data = await res.json();
      setCards(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  /* ------------------------------------------------------------------
   * 폼 입력 핸들러
   * ------------------------------------------------------------------ */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /* ------------------------------------------------------------------
   * 등록 / 수정 폼 제출
   * ------------------------------------------------------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // 유효성 검사
    if (!formData.title.trim())    { setFormError('제목을 입력해주세요.'); return; }
    if (!formData.imageUrl.trim()) { setFormError('이미지 경로를 입력해주세요.'); return; }
    if (formData.linkType !== 'none' && !formData.linkUrl.trim()) {
      setFormError('링크 URL을 입력해주세요.'); return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const isEdit = formMode === 'edit';
      const url    = isEdit
        ? `${API_BASE}/api/admin/banner-cards/${editId}`
        : `${API_BASE}/api/admin/banner-cards`;

      const res = await fetch(url, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          sortOrder: Number(formData.sortOrder),
          // linkType이 none이면 linkUrl 비움
          linkUrl: formData.linkType === 'none' ? '' : formData.linkUrl,
        }),
      });
      if (!res.ok) throw new Error(isEdit ? '수정 실패' : '등록 실패');
      await fetchCards();
      resetForm();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------
   * 수정 시작: 폼에 데이터 채우기
   * ------------------------------------------------------------------ */
  const handleEdit = (card) => {
    setFormMode('edit');
    setEditId(card.id);
    setFormData({
      title:     card.title,
      imageUrl:  card.imageUrl,
      linkType:  card.linkType || 'none',
      linkUrl:   card.linkUrl || '',
      sortOrder: card.sortOrder,
      active:    card.active,
    });
    setFormError('');
    // 폼으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ------------------------------------------------------------------
   * 폼 초기화
   * ------------------------------------------------------------------ */
  const resetForm = () => {
    setFormMode('create');
    setEditId(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  /* ------------------------------------------------------------------
   * 삭제
   * ------------------------------------------------------------------ */
  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" 카드를 삭제하시겠습니까?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/banner-cards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('삭제 실패');
      await fetchCards();
    } catch (e) {
      alert(e.message);
    }
  };

  /* ------------------------------------------------------------------
   * 활성/비활성 토글
   * ------------------------------------------------------------------ */
  const handleToggle = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/banner-cards/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('상태 변경 실패');
      await fetchCards();
    } catch (e) {
      alert(e.message);
    }
  };

  /* ------------------------------------------------------------------
   * 순서 이동 (위/아래 버튼)
   * ------------------------------------------------------------------ */
  const handleMoveOrder = async (index, direction) => {
    const newCards = [...cards];
    const swapIdx  = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newCards.length) return;

    // 두 카드의 sortOrder 교환
    [newCards[index].sortOrder, newCards[swapIdx].sortOrder] =
      [newCards[swapIdx].sortOrder, newCards[index].sortOrder];

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/banner-cards/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          newCards.map(c => ({ id: c.id, sortOrder: c.sortOrder }))
        ),
      });
      if (!res.ok) throw new Error('순서 변경 실패');
      await fetchCards();
    } catch (e) {
      alert(e.message);
    }
  };

  /* ------------------------------------------------------------------
   * 렌더링
   * ------------------------------------------------------------------ */
  return (
    <div className="csm-container page-container">
      {/* 헤더 */}
      <div className="csm-header">
        <button className="csm-back-btn" onClick={() => navigate('/admin')}>
          ← 관리자 메뉴
        </button>
        <h2 className="csm-title">카드 슬라이더 관리</h2>
        <p className="csm-desc">메인 페이지에 표시되는 카드 슬라이더를 관리합니다.</p>
      </div>

      {/* ── 등록 / 수정 폼 ── */}
      <div className="csm-form-section">
        <h3 className="csm-section-title">
          {formMode === 'create' ? '새 카드 등록' : '카드 수정'}
        </h3>

        <form className="csm-form" onSubmit={handleSubmit}>
          {/* 제목 */}
          <div className="csm-field">
            <label htmlFor="title">관리용 제목 <span className="required">*</span></label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="예: 유튜브 채널 카드"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* 이미지 경로 */}
          <div className="csm-field">
            <label htmlFor="imageUrl">
              이미지 경로 <span className="required">*</span>
              <span className="csm-hint"> (로컬: images/card/card1.png | 외부 URL: https://...)</span>
            </label>
            <div className="csm-image-row">
              <input
                id="imageUrl"
                name="imageUrl"
                type="text"
                placeholder="images/card/card1.png 또는 https://..."
                value={formData.imageUrl}
                onChange={handleChange}
              />
              {/* 프리셋 버튼 */}
              <div className="csm-presets">
                {PRESET_IMAGES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    className={`csm-preset-btn ${formData.imageUrl === p.value ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: p.value }))}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {/* 미리보기 */}
            {formData.imageUrl && (
              <div className="csm-preview">
                <img
                  src={
                    formData.imageUrl.startsWith('http')
                      ? formData.imageUrl
                      : `/${formData.imageUrl}`
                  }
                  alt="미리보기"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* 링크 타입 */}
          <div className="csm-field">
            <label htmlFor="linkType">클릭 시 동작</label>
            <select
              id="linkType"
              name="linkType"
              value={formData.linkType}
              onChange={handleChange}
            >
              {LINK_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 링크 URL (linkType이 none이 아닐 때만 표시) */}
          {formData.linkType !== 'none' && (
            <div className="csm-field">
              <label htmlFor="linkUrl">
                링크 URL <span className="required">*</span>
                <span className="csm-hint">
                  {formData.linkType === 'internal'
                    ? ' 예: /church-intro, /location'
                    : ' 예: https://www.youtube.com/...'}
                </span>
              </label>
              <input
                id="linkUrl"
                name="linkUrl"
                type="text"
                placeholder={formData.linkType === 'internal' ? '/church-intro' : 'https://'}
                value={formData.linkUrl}
                onChange={handleChange}
              />
            </div>
          )}

          {/* 순서 + 활성 */}
          <div className="csm-field-row">
            <div className="csm-field csm-field-small">
              <label htmlFor="sortOrder">표시 순서</label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="1"
                value={formData.sortOrder}
                onChange={handleChange}
              />
            </div>
            <div className="csm-field csm-field-check">
              <label className="csm-checkbox-label">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                />
                슬라이더에 표시
              </label>
            </div>
          </div>

          {/* 오류 메시지 */}
          {formError && <p className="csm-form-error">{formError}</p>}

          {/* 버튼 */}
          <div className="csm-form-btns">
            <button type="submit" className="csm-btn csm-btn-save" disabled={saving}>
              {saving ? '저장 중...' : formMode === 'create' ? '등록' : '수정 완료'}
            </button>
            {formMode === 'edit' && (
              <button type="button" className="csm-btn csm-btn-cancel" onClick={resetForm}>
                취소
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── 카드 목록 ── */}
      <div className="csm-list-section">
        <h3 className="csm-section-title">
          등록된 카드 목록
          <span className="csm-count"> ({cards.length}개)</span>
        </h3>

        {loading && <p className="csm-loading">로딩 중...</p>}
        {error   && <p className="csm-error">{error}</p>}

        {!loading && !error && cards.length === 0 && (
          <p className="csm-empty">등록된 카드가 없습니다. 위에서 새 카드를 등록해주세요.</p>
        )}

        {!loading && cards.length > 0 && (
          <div className="csm-table-wrap">
            <table className="csm-table">
              <thead>
                <tr>
                  <th>순서</th>
                  <th>미리보기</th>
                  <th>제목</th>
                  <th>링크</th>
                  <th>상태</th>
                  <th>순서 이동</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card, index) => (
                  <tr key={card.id} className={card.active ? '' : 'csm-row-inactive'}>
                    {/* 순서 번호 */}
                    <td className="csm-td-order">{card.sortOrder}</td>

                    {/* 이미지 미리보기 */}
                    <td className="csm-td-thumb">
                      <img
                        src={
                          card.imageUrl.startsWith('http')
                            ? card.imageUrl
                            : `/${card.imageUrl}`
                        }
                        alt={card.title}
                        className="csm-thumb"
                        onError={(e) => { e.target.style.background = '#eee'; e.target.src=''; }}
                      />
                    </td>

                    {/* 제목 */}
                    <td className="csm-td-title">{card.title}</td>

                    {/* 링크 */}
                    <td className="csm-td-link">
                      {card.linkType === 'none' || !card.linkUrl ? (
                        <span className="csm-badge csm-badge-none">없음</span>
                      ) : (
                        <>
                          <span className={`csm-badge ${card.linkType === 'internal' ? 'csm-badge-internal' : 'csm-badge-external'}`}>
                            {card.linkType === 'internal' ? '내부' : '외부'}
                          </span>
                          <span className="csm-link-url">{card.linkUrl}</span>
                        </>
                      )}
                    </td>

                    {/* 활성 상태 토글 */}
                    <td className="csm-td-active">
                      <button
                        className={`csm-toggle-btn ${card.active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggle(card.id)}
                        title={card.active ? '클릭하면 숨김' : '클릭하면 표시'}
                      >
                        {card.active ? '표시 중' : '숨김'}
                      </button>
                    </td>

                    {/* 순서 이동 */}
                    <td className="csm-td-move">
                      <button
                        className="csm-move-btn"
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        title="위로"
                      >▲</button>
                      <button
                        className="csm-move-btn"
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === cards.length - 1}
                        title="아래로"
                      >▼</button>
                    </td>

                    {/* 수정 / 삭제 */}
                    <td className="csm-td-actions">
                      <button
                        className="csm-btn csm-btn-edit"
                        onClick={() => handleEdit(card)}
                      >
                        수정
                      </button>
                      <button
                        className="csm-btn csm-btn-delete"
                        onClick={() => handleDelete(card.id, card.title)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardSliderManagePage;
