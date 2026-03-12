// src/pages/admin/CardSliderManagePage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CardSliderManagePage.css';
import { resolveImageSrc } from '../../utils/cardImageMap';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const LINK_TYPE_OPTIONS = [
  { value: 'none',     label: '없음 (클릭 무반응)' },
  { value: 'internal', label: '내부 이동 (React 라우터)' },
  { value: 'external', label: '외부 링크 (새 탭)' },
];

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
  const fileInputRef = useRef(null);

  const [cards, setCards]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [formMode, setFormMode]   = useState('create');
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);

  // 이미지 업로드 상태
  const [uploadFile, setUploadFile]       = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploading, setUploading]         = useState(false);
  const [uploadError, setUploadError]     = useState('');

  /* 목록 조회 */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/banner-cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('목록 조회 실패');
      setCards(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  /* 파일 선택 */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('이미지 파일만 선택 가능합니다.'); return; }
    if (file.size > 5 * 1024 * 1024)    { setUploadError('파일 크기는 5MB 이하여야 합니다.'); return; }

    setUploadError('');
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  /* S3 업로드 */
  const handleUpload = async () => {
    if (!uploadFile) { setUploadError('파일을 먼저 선택해주세요.'); return; }
    setUploading(true);
    setUploadError('');
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', uploadFile);
      const res = await fetch(`${API_BASE}/api/admin/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || '업로드 실패'); }
      const { url } = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: url }));
      setUploadFile(null);
      setUploadPreview(url);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  /* 미리보기 src */
  const previewSrc = uploadPreview || resolveImageSrc(formData.imageUrl) || '';

  /* 폼 입력 */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  /* 폼 제출 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.title.trim()) { setFormError('제목을 입력해주세요.'); return; }
    if (!formData.imageUrl)     { setFormError('이미지를 업로드해주세요.'); return; }
    if (formData.linkType !== 'none' && !formData.linkUrl.trim()) { setFormError('링크 URL을 입력해주세요.'); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const isEdit = formMode === 'edit';
      const res = await fetch(
        isEdit ? `${API_BASE}/api/admin/banner-cards/${editId}` : `${API_BASE}/api/admin/banner-cards`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...formData,
            sortOrder: Number(formData.sortOrder),
            linkUrl: formData.linkType === 'none' ? '' : formData.linkUrl,
          }),
        }
      );
      if (!res.ok) throw new Error(isEdit ? '수정 실패' : '등록 실패');
      await fetchCards();
      resetForm();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* 수정 시작 */
  const handleEdit = (card) => {
    setFormMode('edit');
    setEditId(card.id);
    setFormData({ title: card.title, imageUrl: card.imageUrl, linkType: card.linkType || 'none', linkUrl: card.linkUrl || '', sortOrder: card.sortOrder, active: card.active });
    setUploadFile(null);
    setUploadPreview('');
    setFormError('');
    setUploadError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* 폼 초기화 */
  const resetForm = () => {
    setFormMode('create');
    setEditId(null);
    setFormData(EMPTY_FORM);
    setUploadFile(null);
    setUploadPreview('');
    setFormError('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* 삭제 */
  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" 카드를 삭제하시겠습니까?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/banner-cards/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('삭제 실패');
      await fetchCards();
    } catch (e) { alert(e.message); }
  };

  /* 토글 */
  const handleToggle = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/banner-cards/${id}/toggle`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('상태 변경 실패');
      await fetchCards();
    } catch (e) { alert(e.message); }
  };

  /* 순서 이동 */
  const handleMoveOrder = async (index, direction) => {
    const newCards = [...cards];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newCards.length) return;
    [newCards[index].sortOrder, newCards[swapIdx].sortOrder] = [newCards[swapIdx].sortOrder, newCards[index].sortOrder];
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/banner-cards/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCards.map(c => ({ id: c.id, sortOrder: c.sortOrder }))),
      });
      if (!res.ok) throw new Error('순서 변경 실패');
      await fetchCards();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="csm-container page-container">
      <div className="csm-header">
        <button className="csm-back-btn" onClick={() => navigate('/admin')}>← 관리자 메뉴</button>
        <h2 className="csm-title">카드 슬라이더 관리</h2>
        <p className="csm-desc">메인 페이지에 표시되는 카드 슬라이더를 관리합니다.</p>
      </div>

      {/* 폼 */}
      <div className="csm-form-section">
        <h3 className="csm-section-title">{formMode === 'create' ? '새 카드 등록' : '카드 수정'}</h3>
        <form className="csm-form" onSubmit={handleSubmit}>

          {/* 제목 */}
          <div className="csm-field">
            <label htmlFor="title">관리용 제목 <span className="required">*</span></label>
            <input id="title" name="title" type="text" placeholder="예: 유튜브 채널 카드" value={formData.title} onChange={handleChange} />
          </div>

          {/* 이미지 업로드 */}
          <div className="csm-field">
            <label>카드 이미지 <span className="required">*</span><span className="csm-hint"> (jpg, png · 권장 615×360px · 최대 5MB)</span></label>
            <div className="csm-upload-area">
              {/* 미리보기 클릭 영역 */}
              <div className={`csm-upload-preview ${previewSrc ? 'has-image' : ''}`} onClick={() => fileInputRef.current?.click()}>
                {previewSrc ? (
                  <img src={previewSrc} alt="미리보기" />
                ) : (
                  <div className="csm-upload-placeholder">
                    <span className="csm-upload-icon">🖼️</span>
                    <span>클릭하여 이미지 선택</span>
                    <span className="csm-hint">권장 크기: 615 × 360px</span>
                  </div>
                )}
              </div>

              {/* 버튼 영역 */}
              <div className="csm-upload-controls">
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="csm-btn csm-btn-file" onClick={() => fileInputRef.current?.click()}>📁 파일 선택</button>

                {uploadFile && (
                  <>
                    <span className="csm-filename">{uploadFile.name}</span>
                    <button type="button" className="csm-btn csm-btn-upload" onClick={handleUpload} disabled={uploading}>
                      {uploading ? '업로드 중...' : '⬆ S3 업로드'}
                    </button>
                  </>
                )}

                {!uploadFile && formData.imageUrl && formData.imageUrl.startsWith('http') && (
                  <span className="csm-upload-done">✅ 업로드 완료</span>
                )}

                {formMode === 'edit' && formData.imageUrl && (
                  <button type="button" className="csm-btn csm-btn-cancel" onClick={() => { setFormData(prev => ({ ...prev, imageUrl: '' })); setUploadPreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                    이미지 변경
                  </button>
                )}
              </div>

              {uploadFile && !uploading && (
                <p className="csm-upload-notice">⚠️ 파일 선택 후 반드시 <strong>"S3 업로드"</strong> 버튼을 눌러주세요.</p>
              )}
              {uploadError && <p className="csm-form-error">{uploadError}</p>}
            </div>
          </div>

          {/* 링크 타입 */}
          <div className="csm-field">
            <label htmlFor="linkType">클릭 시 동작</label>
            <select id="linkType" name="linkType" value={formData.linkType} onChange={handleChange}>
              {LINK_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {formData.linkType !== 'none' && (
            <div className="csm-field">
              <label htmlFor="linkUrl">링크 URL <span className="required">*</span>
                <span className="csm-hint">{formData.linkType === 'internal' ? ' 예: /church-intro, /location' : ' 예: https://www.youtube.com/...'}</span>
              </label>
              <input id="linkUrl" name="linkUrl" type="text" placeholder={formData.linkType === 'internal' ? '/church-intro' : 'https://'} value={formData.linkUrl} onChange={handleChange} />
            </div>
          )}

          <div className="csm-field-row">
            <div className="csm-field csm-field-small">
              <label htmlFor="sortOrder">표시 순서</label>
              <input id="sortOrder" name="sortOrder" type="number" min="1" value={formData.sortOrder} onChange={handleChange} />
            </div>
            <div className="csm-field csm-field-check">
              <label className="csm-checkbox-label">
                <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
                슬라이더에 표시
              </label>
            </div>
          </div>

          {formError && <p className="csm-form-error">{formError}</p>}

          <div className="csm-form-btns">
            <button type="submit" className="csm-btn csm-btn-save" disabled={saving}>
              {saving ? '저장 중...' : formMode === 'create' ? '등록' : '수정 완료'}
            </button>
            {formMode === 'edit' && <button type="button" className="csm-btn csm-btn-cancel" onClick={resetForm}>취소</button>}
          </div>
        </form>
      </div>

      {/* 목록 */}
      <div className="csm-list-section">
        <h3 className="csm-section-title">등록된 카드 목록<span className="csm-count"> ({cards.length}개)</span></h3>
        {loading && <p className="csm-loading">로딩 중...</p>}
        {error   && <p className="csm-error">{error}</p>}
        {!loading && !error && cards.length === 0 && <p className="csm-empty">등록된 카드가 없습니다.</p>}
        {!loading && cards.length > 0 && (
          <div className="csm-table-wrap">
            <table className="csm-table">
              <thead>
                <tr><th>순서</th><th>미리보기</th><th>제목</th><th>링크</th><th>상태</th><th>순서 이동</th><th>작업</th></tr>
              </thead>
              <tbody>
                {cards.map((card, index) => (
                  <tr key={card.id} className={card.active ? '' : 'csm-row-inactive'}>
                    <td className="csm-td-order">{card.sortOrder}</td>
                    <td className="csm-td-thumb">
                      <img src={resolveImageSrc(card.imageUrl)} alt={card.title} className="csm-thumb"
                        onError={(e) => { e.target.style.background = '#eee'; e.target.src = ''; }} />
                    </td>
                    <td className="csm-td-title">{card.title}</td>
                    <td className="csm-td-link">
                      {card.linkType === 'none' || !card.linkUrl ? (
                        <span className="csm-badge csm-badge-none">없음</span>
                      ) : (
                        <><span className={`csm-badge ${card.linkType === 'internal' ? 'csm-badge-internal' : 'csm-badge-external'}`}>{card.linkType === 'internal' ? '내부' : '외부'}</span><span className="csm-link-url">{card.linkUrl}</span></>
                      )}
                    </td>
                    <td className="csm-td-active">
                      <button className={`csm-toggle-btn ${card.active ? 'active' : 'inactive'}`} onClick={() => handleToggle(card.id)}>
                        {card.active ? '표시 중' : '숨김'}
                      </button>
                    </td>
                    <td className="csm-td-move">
                      <button className="csm-move-btn" onClick={() => handleMoveOrder(index, 'up')}   disabled={index === 0}>▲</button>
                      <button className="csm-move-btn" onClick={() => handleMoveOrder(index, 'down')} disabled={index === cards.length - 1}>▼</button>
                    </td>
                    <td className="csm-td-actions">
                      <button className="csm-btn csm-btn-edit"   onClick={() => handleEdit(card)}>수정</button>
                      <button className="csm-btn csm-btn-delete" onClick={() => handleDelete(card.id, card.title)}>삭제</button>
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