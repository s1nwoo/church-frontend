import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import AdminBackButton from '../../components/AdminBackButton';
import BibleVersePicker from './BibleVersePicker';
import './BiblePptPage.css';

const API = '/api/admin/bible-ppt';
const STYLE_KEY = 'banghwa-bible-ppt-style-v1';
const PPT_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` });
const clone = value => JSON.parse(JSON.stringify(value));
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
async function errorMessage(error) {
  if ([401, 403].includes(error.response?.status)) return '관리자 로그인이 필요합니다. 다시 로그인해 주세요.';
  let data = error.response?.data;
  if (data instanceof Blob) { try { data = JSON.parse(await data.text()); } catch { data = null; } }
  return data?.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
function composeTitle(parts) {
  const titles = [...new Set(parts.map(s => s.title))], refs = titles.map(t => /^(\D+\d+):(\d+)$/.exec(t));
  if (refs.every(Boolean) && refs.every((r, i) => r[1] === refs[0][1] && (!i || Number(r[2]) === Number(refs[i - 1][2]) + 1))) {
    return `${refs[0][1]}:${refs[0][2]}${refs.length > 1 ? `-${refs[refs.length - 1][2]}` : ''}`;
  }
  return titles.join(', ');
}

export default function BiblePptPage() {
  const { user } = useContext(AuthContext);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.name || user?.role?.value;
  const admin = role === 'ADMIN' || role === 'ROLE_ADMIN';
  const [metadata, setMetadata] = useState(null), [globalStyle, setGlobalStyle] = useState(null);
  const [reference, setReference] = useState(''), [lineLimit, setLineLimit] = useState('');
  const [search, setSearch] = useState(''), [book, setBook] = useState(null), [pickerBook, setPickerBook] = useState(null);
  const [slides, setSlides] = useState([]), [active, setActive] = useState(0), [selected, setSelected] = useState([]);
  const [individual, setIndividual] = useState(false), [saving, setSaving] = useState(false), [building, setBuilding] = useState(false);
  const [builtKey, setBuiltKey] = useState(''), [validation, setValidation] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [filename, setFilename] = useState('');
  const [preview, setPreview] = useState(''), [previewBusy, setPreviewBusy] = useState(false), [previewError, setPreviewError] = useState('');
  const [retry, setRetry] = useState(0), [revision, setRevision] = useState(0);
  const previewRef = useRef(null), referenceRef = useRef(null), drag = useRef(null), selectionAnchor = useRef(0);
  const current = slides[active], style = current?.style || globalStyle;
  const editStyle = individual && current ? style : globalStyle;
  const inputKey = JSON.stringify([reference.trim(), Number(lineLimit)]);
  const canSave = slides.length > 0 && builtKey === inputKey && !validation && !building && !saving;
  const suggestedName = `${reference.trim().replace(/[^가-힣\w,:~-]+/g, '_').slice(0, 80) || '성경말씀'}_${today()}.pptx`;

  useEffect(() => {
    if (!admin) return;
    const controller = new AbortController(); setError('');
    axios.get(`${API}/metadata`, { headers: headers(), signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      setMetadata(data);
      let saved;
      try { saved = JSON.parse(localStorage.getItem(STYLE_KEY)); } catch { /* Template defaults. */ }
      const validBox = b => b && ['x', 'y', 'width', 'height'].every(k => Number.isFinite(b[k]))
        && b.x >= 0 && b.y >= 0 && b.width >= 1 && b.height >= 1 && b.x + b.width <= data.width && b.y + b.height <= data.height;
      const valid = saved && ['titleFontSize', 'bodyFontSize'].every(k => Number.isFinite(saved[k]) && saved[k] >= 8 && saved[k] <= 120)
        && validBox(saved.title) && validBox(saved.body);
      setGlobalStyle(valid ? saved : data.defaultStyle);
    }).catch(async e => { if (!controller.signal.aborted) setError(await errorMessage(e)); });
    return () => controller.abort();
  }, [admin, retry]);

  // Cancel stale requests so only the latest reference can enable saving.
  useEffect(() => {
    if (!admin || !metadata) return;
    setNotice(''); setValidation('');
    if (!reference.trim()) {
      setSlides([]); setSelected([]); setActive(0); setBuiltKey(''); setBuilding(false); return;
    }
    const limit = Number(lineLimit);
    if (!Number.isInteger(limit) || limit < 0 || limit > 12) {
      setValidation('줄 수는 비워 두거나 0~12 사이의 정수로 입력해 주세요.'); setBuilding(false); return;
    }
    const controller = new AbortController(); setBuilding(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post(`${API}/slides`, { reference, lineLimit: limit }, { headers: headers(), signal: controller.signal });
        if (controller.signal.aborted) return;
        setSlides(data); setActive(0); setSelected([]); setIndividual(false); setBuiltKey(inputKey);
      } catch (e) { if (!controller.signal.aborted) setValidation(await errorMessage(e)); }
      finally { if (!controller.signal.aborted) setBuilding(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [reference, lineLimit, metadata, admin, inputKey, revision]);

  useEffect(() => {
    setPreview(''); setPreviewError(''); setPreviewBusy(false);
    if (!current || !style || !admin) return;
    const controller = new AbortController(); let url; setPreviewBusy(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post(`${API}/preview`, { title: current.title, body: current.body, style },
          { headers: headers(), responseType: 'blob', signal: controller.signal });
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(data); setPreview(url);
      } catch (e) { if (!controller.signal.aborted) setPreviewError(await errorMessage(e)); }
      finally { if (!controller.signal.aborted) setPreviewBusy(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [current, style, admin]);

  const updateCurrent = patch => setSlides(old => old.map((s, i) => i === active ? { ...s, ...patch } : s));
  const updateStyle = next => {
    if (individual && current) updateCurrent({ style: next }); else setGlobalStyle(next);
    setNotice('');
  };
  const editFont = (box, value) => updateStyle({ ...editStyle, [`${box}FontSize`]: Math.max(8, Math.min(120, Number(value))) });
  function chooseSlide(event, index) {
    setActive(index); setIndividual(!!slides[index].style);
    if (event.shiftKey) {
      const from = Math.min(selectionAnchor.current, index), to = Math.max(selectionAnchor.current, index);
      setSelected(Array.from({ length: to - from + 1 }, (_, i) => from + i));
    } else if (event.ctrlKey || event.metaKey) {
      setSelected(old => old.includes(index) ? old.filter(i => i !== index) : [...old, index]); selectionAnchor.current = index;
    } else { setSelected([index]); selectionAnchor.current = index; }
  }
  function merge() {
    const indices = [...selected].sort((a, b) => a - b), group = indices.map(i => slides[i]);
    const merged = { title: composeTitle(group), body: group.map(s => s.body).join('\n'),
      parts: group.flatMap(s => s.parts || [s]), style: group[0].style };
    setSlides(slides.flatMap((s, i) => i === indices[0] ? [merged] : indices.includes(i) ? [] : [s]));
    setActive(indices[0]); setSelected([indices[0]]);
  }
  function split() { setSlides(slides.flatMap((s, i) => i === active ? s.parts : [s])); setSelected([active]); }
  function saveStyle() {
    try { localStorage.setItem(STYLE_KEY, JSON.stringify(globalStyle)); setNotice('현재 전체 설정을 이 브라우저에 저장했습니다.'); }
    catch { setError('이 브라우저에 설정을 저장할 수 없습니다.'); }
  }
  async function download() {
    if (!canSave) return;
    setSaving(true); setError(''); setNotice('');
    const name = Array.from(filename.trim() || suggestedName, c => c.charCodeAt(0) < 32 ? '_' : c).join('').replace(/[<>:"/\\|?*]/g, '_');
    const outputName = /\.pptx$/i.test(name) ? name : `${name}.pptx`;
    try {
      // Open the picker during click activation. Cancelling sends no generation request.
      const handle = typeof window.showSaveFilePicker === 'function' ? await window.showSaveFilePicker({
        suggestedName: outputName, types: [{ description: 'PowerPoint', accept: { [PPT_TYPE]: ['.pptx'] } }]
      }) : null;
      const { data } = await axios.post(`${API}/download`, {
        slides: slides.map(s => ({ title: s.title, body: s.body, style: s.style || globalStyle }))
      }, { headers: headers(), responseType: 'blob' });
      if (handle) {
        const writable = await handle.createWritable();
        try { await writable.write(data); await writable.close(); }
        catch (e) { await writable.abort().catch(() => {}); throw e; }
      } else {
        const url = URL.createObjectURL(data), link = document.createElement('a');
        link.href = url; link.download = outputName; document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      let saved = true;
      try { localStorage.setItem(STYLE_KEY, JSON.stringify(globalStyle)); } catch { saved = false; }
      setNotice(`PPT 파일을 저장했습니다.${saved ? ' 화면 설정도 이 브라우저에 저장했습니다.' : ' 화면 설정은 저장하지 못했습니다.'}`);
    } catch (e) { if (e.name !== 'AbortError') setError(await errorMessage(e)); }
    finally { setSaving(false); }
  }
  function startDrag(event, box) {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    const onlyThis = !!current?.style || individual; if (onlyThis) setIndividual(true);
    drag.current = { box, x: event.clientX, y: event.clientY, style: clone(style), onlyThis };
  }
  function moveDrag(event) {
    if (!drag.current || !previewRef.current) return;
    const { box, x, y, style: initial, onlyThis } = drag.current, rect = previewRef.current.getBoundingClientRect(), b = initial[box];
    const next = { ...initial, [box]: { ...b,
      x: Math.max(0, Math.min(metadata.width - b.width, b.x + (event.clientX - x) * metadata.width / rect.width)),
      y: Math.max(0, Math.min(metadata.height - b.height, b.y + (event.clientY - y) * metadata.height / rect.height)) } };
    if (onlyThis) updateCurrent({ style: next }); else setGlobalStyle(next);
  }

  if (!admin) return <main className="bible-ppt page-container"><AdminBackButton /><h1>성경 PPT 만들기</h1>
    <p>관리자 로그인 후 이용할 수 있습니다.</p><Link to="/login">로그인하기</Link></main>;
  return <main className="bible-ppt page-container">
    <div className="bp-heading"><div><AdminBackButton /><h1>성경 PPT 만들기</h1></div><p>성경 검색부터 미리보기·편집·PPT 저장까지 한 화면에서 준비하세요.</p></div>
    {error && <div role="alert" className="bp-error">{error}{!metadata && <button onClick={() => setRetry(v => v + 1)}>다시 불러오기</button>}</div>}
    {notice && <p role="status" className="bp-notice">{notice}</p>}
    {!metadata || !globalStyle ? <p>성경 데이터와 템플릿을 불러오는 중입니다.</p> : <>
      <div className="bp-studio"><div className="bp-input-column">
        <section className="bp-panel bp-search"><h2>① 성경 검색</h2>
          <label className="bp-sr-only" htmlFor="bp-book-search">성경 검색</label>
          <input id="bp-book-search" placeholder="성경 이름이나 약자를 검색하세요" value={search} disabled={saving} onChange={e => setSearch(e.target.value)} />
          <p className="bp-help">성경을 더블클릭하거나 선택 후 ‘장·절 선택’을 누르세요.</p>
          <div className="bp-book-list" role="listbox" aria-label="성경 목록">{metadata.books.filter(b => `${b.name} ${b.abbreviation}`.includes(search.trim())).map(b =>
            <button type="button" role="option" aria-selected={book?.abbreviation === b.abbreviation} key={b.abbreviation} disabled={saving}
              onClick={() => setBook(b)} onDoubleClick={() => setPickerBook(b)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setPickerBook(b); } }}>
              {b.name} <span>({b.abbreviation})</span></button>)}</div>
          <button className="bp-book-select" disabled={!book || saving} onClick={() => setPickerBook(book)}>장·절 선택</button>
        </section>
        <section className="bp-panel bp-reference"><h2>② 구절 입력</h2>
          <label className="bp-sr-only" htmlFor="bp-reference">성경 구절</label>
          <input ref={referenceRef} id="bp-reference" value={reference} disabled={saving} aria-invalid={!!validation} aria-describedby="bp-validation bp-reference-help"
            onChange={e => setReference(e.target.value)} placeholder="예: 창1:1-5 출1:1-2" maxLength={2000} />
          <p id="bp-reference-help" className="bp-help">창1:1-5 · 창1:1,3,5 · 창1:1~3 요3:16<br />입력하면 자동으로 미리보기가 바뀝니다. (개역한글)</p>
          <div className="bp-limit-row"><label htmlFor="bp-line-limit">줄 수 제한</label><input id="bp-line-limit" type="number" min="0" max="12" value={lineLimit}
            disabled={saving} onChange={e => setLineLimit(e.target.value)} placeholder="비우면 제한 없음" /></div>
          <p id="bp-validation" className={`bp-validation ${validation ? 'is-invalid' : ''}`} role={validation ? 'alert' : 'status'}>
            {validation || (building ? '입력한 구절을 확인하고 있습니다…' : !reference.trim() ? '구절을 입력하거나 위에서 장·절을 선택해 주세요.' : `${slides.length}개 슬라이드 · 미리보기를 확인하세요.`)}</p>
          <button className="bp-text-button" disabled={!reference.trim() || saving || building} onClick={() => setRevision(v => v + 1)}>다시 생성</button>
          <span className="bp-help"> 구절을 바꾸면 편집한 슬라이드가 새로 생성됩니다.</span>
        </section>
        <section className="bp-panel bp-list"><h2>③ 슬라이드 목록 <small>{slides.length}장</small></h2><p className="bp-help">Ctrl/⌘·Shift 또는 체크박스로 여러 장을 선택하세요.</p>
          <ol>{slides.length ? slides.map((s, i) => <li key={i} className={`${active === i ? 'is-active' : ''} ${selected.includes(i) ? 'is-selected' : ''}`}>
            <input type="checkbox" aria-label={`${i + 1}번 슬라이드 선택`} checked={selected.includes(i)} disabled={!canSave}
              onChange={e => { selectionAnchor.current = i; setSelected(e.target.checked ? [...selected, i] : selected.filter(v => v !== i)); }} />
            <button aria-pressed={active === i} disabled={saving} onClick={e => chooseSlide(e, i)}><strong>슬라이드 {i + 1} [{s.title}] {s.style && '★'}</strong><span>{s.body}</span></button>
          </li>) : <li className="bp-empty-list">입력한 구절의 슬라이드가 여기에 표시됩니다.</li>}</ol>
          <div className="bp-list-actions"><button disabled={selected.length < 2 || !canSave} onClick={merge}>선택한 슬라이드 합치기</button><button disabled={!current?.parts || !canSave} onClick={split}>나누기</button></div>
        </section>
      </div>
      <section className="bp-panel bp-editor"><h2>④ 실제 미리보기</h2><p className="bp-help">제목·본문 상자를 끌어 위치를 옮길 수 있습니다.</p>
        <fieldset disabled={saving} className="bp-controls">{['title', 'body'].map(box => <div className="bp-slider-row" key={box}>
          <label htmlFor={`bp-${box}-slider`}>{box === 'title' ? '제목' : '본문'} 크기</label>
          <input id={`bp-${box}-slider`} type="range" min="8" max="120" step="1" value={editStyle[`${box}FontSize`]} onChange={e => editFont(box, e.target.value)} />
          <label className="bp-sr-only" htmlFor={`bp-${box}-size`}>{box === 'title' ? '제목' : '본문'} 크기 직접 입력</label>
          <input id={`bp-${box}-size`} type="number" min="8" max="120" step="1" value={Number(editStyle[`${box}FontSize`].toFixed(1))} onChange={e => editFont(box, e.target.value)} /><span>pt</span>
        </div>)}<label className="bp-check"><input type="checkbox" disabled={!current} checked={individual} onChange={e => setIndividual(e.target.checked)} />이 슬라이드에만 적용</label></fieldset>
        {current?.style && <button className="bp-text-button" disabled={saving} onClick={() => updateCurrent({ style: null })}>이 슬라이드의 개별 설정 해제</button>}
        <div ref={previewRef} className="bp-preview" style={{ aspectRatio: `${metadata.width}/${metadata.height}` }} aria-label="슬라이드 미리보기 영역">
          {preview && <img src={preview} alt={`${active + 1}번 슬라이드 미리보기`} draggable="false" />}
          {!current && <div className="bp-preview-empty"><strong>말씀 슬라이드 미리보기</strong><span>왼쪽에서 성경 구절을 선택하거나 입력해 주세요.</span></div>}
          {previewBusy && <span className="bp-preview-status" role="status">미리보기 만드는 중…</span>}{previewError && <span className="bp-preview-status" role="alert">{previewError}</span>}
          {current && ['title', 'body'].map(box => <div key={box} className={`bp-drag bp-drag-${box}`} title={`${box === 'title' ? '제목' : '본문'} 위치 이동`}
            style={{ left: `${style[box].x / metadata.width * 100}%`, top: `${style[box].y / metadata.height * 100}%`, width: `${style[box].width / metadata.width * 100}%`,
              height: `${style[box].height / metadata.height * 100}%`, pointerEvents: saving ? 'none' : undefined }} onPointerDown={e => startDrag(e, box)} onPointerMove={moveDrag}
            onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}><span>{box === 'title' ? '제목' : '본문'}</span></div>)}
        </div>
        <div className="bp-style-actions"><button disabled={saving} onClick={saveStyle}>현재 설정 저장</button><button disabled={saving} onClick={() => {
          if (individual && current) updateCurrent({ style: null }); else setGlobalStyle(clone(metadata.defaultStyle));
          setNotice(individual ? '이 슬라이드의 개별 설정을 해제했습니다.' : '전체 설정을 템플릿 기본값으로 초기화했습니다.');
        }}>템플릿 기본값으로 초기화</button></div>
        <details className="bp-edit-details"><summary>본문 편집 · 위치와 상자 크기 직접 입력</summary>
          <fieldset disabled={!current || saving}><label>슬라이드 제목<input maxLength={500} value={current?.title || ''} onChange={e => updateCurrent({ title: e.target.value })} /></label>
            <label>본문<textarea rows="4" maxLength={8000} value={current?.body || ''} onChange={e => updateCurrent({ body: e.target.value })} /></label></fieldset>
          {current?.parts && <p className="bp-help">‘나누기’를 누르면 합치기 전 내용으로 돌아갑니다.</p>}
          <div className="bp-style-grid">{['title', 'body'].map(box => <fieldset key={box} disabled={saving}><legend>{box === 'title' ? '제목' : '본문'} 위치·크기 (pt)</legend>
            {['x', 'y', 'width', 'height'].map(key => <label key={key}>{{ x: '가로 위치', y: '세로 위치', width: '상자 너비', height: '상자 높이' }[key]}
              <input type="number" step="1" value={Number(editStyle[box][key].toFixed(1))} onChange={e => {
                const b = { ...editStyle[box], [key]: Number(e.target.value) };
                b.width = Math.max(1, Math.min(metadata.width, b.width)); b.height = Math.max(1, Math.min(metadata.height, b.height));
                b.x = Math.max(0, Math.min(metadata.width - b.width, b.x)); b.y = Math.max(0, Math.min(metadata.height - b.height, b.y)); updateStyle({ ...editStyle, [box]: b });
              }} /></label>)}</fieldset>)}</div>
        </details>
      </section></div>
      <div className="bp-save-bar"><label>저장할 파일명<input value={filename} disabled={saving} onChange={e => setFilename(e.target.value)} placeholder={suggestedName} maxLength={150} /></label>
        <button className="bp-primary" disabled={!canSave} onClick={download}>{saving ? 'PPT 저장 중…' : 'PPT 저장…'}</button></div>
      <p className="bp-help bp-footer-note">최대 200장 · 빈 줄 수 제한은 분할 없음 · 저장할 때 화면 설정도 기억합니다.<br />저장 위치 선택을 지원하지 않는 브라우저에서는 다운로드 폴더에 저장됩니다. 발표용 PC에는 Pretendard Black 글꼴을 설치해 주세요.</p>
    </>}
    {pickerBook && <BibleVersePicker book={pickerBook} onClose={() => setPickerBook(null)} onAdd={token => {
      setReference(v => `${v.trim()} ${token}`.trim()); setPickerBook(null); referenceRef.current?.focus();
    }} />}
  </main>;
}
