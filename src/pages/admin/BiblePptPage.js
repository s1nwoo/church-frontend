import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './BiblePptPage.css';
import AdminBackButton from '../../components/AdminBackButton';

const API = '/api/admin/bible-ppt';
const STYLE_KEY = 'banghwa-bible-ppt-style-v1';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` });
const clone = value => JSON.parse(JSON.stringify(value));

async function errorMessage(error) {
  if ([401, 403].includes(error.response?.status)) return '관리자 로그인이 필요합니다. 다시 로그인해 주세요.';
  let data = error.response?.data;
  if (data instanceof Blob) {
    try { data = JSON.parse(await data.text()); } catch { data = null; }
  }
  return data?.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export default function BiblePptPage() {
  const { user } = useContext(AuthContext);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.name || user?.role?.value;
  const admin = role === 'ADMIN' || role === 'ROLE_ADMIN';
  const [metadata, setMetadata] = useState(null);
  const [reference, setReference] = useState('');
  const [lineLimit, setLineLimit] = useState(3);
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState([]);
  const [globalStyle, setGlobalStyle] = useState(null);
  const [individual, setIndividual] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [retry, setRetry] = useState(0);
  const previewRef = useRef(null);
  const drag = useRef(null);
  const current = slides[active];
  const style = current?.style || globalStyle;

  useEffect(() => {
    if (!admin) return;
    const controller = new AbortController();
    setError('');
    axios.get(`${API}/metadata`, { headers: headers(), signal: controller.signal }).then(({ data }) => {
      setMetadata(data);
      let saved;
      try { saved = JSON.parse(localStorage.getItem(STYLE_KEY)); } catch { /* Use template defaults. */ }
      const validBox = b => b && ['x', 'y', 'width', 'height'].every(k => Number.isFinite(b[k]))
        && b.x >= 0 && b.y >= 0 && b.width >= 1 && b.height >= 1
        && b.x + b.width <= data.width && b.y + b.height <= data.height;
      const valid = saved && ['titleFontSize', 'bodyFontSize'].every(k => Number.isFinite(saved[k]) && saved[k] >= 8 && saved[k] <= 120)
        && validBox(saved.title) && validBox(saved.body);
      setGlobalStyle(valid ? saved : data.defaultStyle);
    }).catch(async e => { if (!axios.isCancel(e)) setError(await errorMessage(e)); });
    return () => controller.abort();
  }, [admin, retry]);

  useEffect(() => {
    setPreview('');
    setPreviewError('');
    if (!current || !style || !admin) return;
    const controller = new AbortController();
    let url;
    setPreviewBusy(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post(`${API}/preview`, { title: current.title, body: current.body, style },
          { headers: headers(), responseType: 'blob', signal: controller.signal });
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(data);
        setPreview(url);
      } catch (e) {
        if (!controller.signal.aborted) setPreviewError(await errorMessage(e));
      } finally {
        if (!controller.signal.aborted) setPreviewBusy(false);
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [current, style, admin]);

  const updateCurrent = patch => setSlides(old => old.map((s, i) => i === active ? { ...s, ...patch } : s));
  const updateStyle = next => {
    if (individual) updateCurrent({ style: next });
    else setGlobalStyle(next);
    setNotice('');
  };

  async function build(event) {
    event.preventDefault();
    setBusy('build'); setError(''); setNotice('');
    try {
      const { data } = await axios.post(`${API}/slides`, { reference, lineLimit: Number(lineLimit) }, { headers: headers() });
      setSlides(data); setActive(0); setSelected([]);
      setNotice(`${data.length}장의 슬라이드를 만들었습니다.`);
    } catch (e) { setError(await errorMessage(e)); }
    finally { setBusy(''); }
  }

  function merge() {
    const indices = [...selected].sort((a, b) => a - b);
    const parts = indices.flatMap(i => slides[i].parts || [slides[i]]);
    const merged = { title: [...new Set(parts.map(s => s.title))].join(', '),
      body: parts.map(s => s.body).join('\n'), parts, style: slides[indices[0]].style };
    setSlides(slides.flatMap((s, i) => i === indices[0] ? [merged] : indices.includes(i) ? [] : [s]));
    setActive(indices[0]); setSelected([]);
  }

  function split() {
    setSlides(slides.flatMap((s, i) => i === active ? s.parts : [s]));
    setSelected([]);
  }

  async function download() {
    setBusy('download'); setError(''); setNotice('');
    try {
      const { data } = await axios.post(`${API}/download`, {
        slides: slides.map(s => ({ title: s.title, body: s.body, style: s.style || globalStyle }))
      }, { headers: headers(), responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
      link.download = `성경말씀_${date}.pptx`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('PPT 파일을 다운로드했습니다.');
    } catch (e) { setError(await errorMessage(e)); }
    finally { setBusy(''); }
  }

  function startDrag(event, box) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { box, x: event.clientX, y: event.clientY, style: clone(style) };
  }

  function moveDrag(event) {
    if (!drag.current || !previewRef.current) return;
    const { box, x, y, style: initial } = drag.current;
    const rect = previewRef.current.getBoundingClientRect();
    const b = initial[box];
    const next = { ...b,
      x: Math.max(0, Math.min(metadata.width - b.width, b.x + (event.clientX - x) * metadata.width / rect.width)),
      y: Math.max(0, Math.min(metadata.height - b.height, b.y + (event.clientY - y) * metadata.height / rect.height)) };
    updateStyle({ ...initial, [box]: next });
  }

  if (!admin) return <main className="bible-ppt page-container"><AdminBackButton /><h1>성경 PPT 만들기</h1>
    <p>관리자 로그인 후 이용할 수 있습니다.</p><Link to="/login">로그인하기</Link></main>;

  return <main className="bible-ppt page-container">
    <div className="bp-heading"><div><AdminBackButton /><h1>성경 PPT 만들기</h1>
      <p>말씀을 입력하고 예배에 사용할 슬라이드를 준비하세요.</p></div>
      <button className="bp-primary" disabled={!slides.length || !!busy} onClick={download}>
        {busy === 'download' ? 'PPT 만드는 중…' : 'PPT 다운로드'}</button></div>
    {error && <div role="alert" className="bp-error">{error}
      {!metadata && <button onClick={() => setRetry(v => v + 1)}>다시 불러오기</button>}</div>}
    {notice && <p role="status" className="bp-notice">{notice}</p>}
    {!metadata ? <p>성경 데이터와 템플릿을 불러오는 중입니다.</p> : <>
      <form onSubmit={build} className="bp-panel">
        <fieldset disabled={!!busy}><legend>1. 성경 구절 입력</legend>
          <label htmlFor="bp-reference">성경 구절</label>
          <input id="bp-reference" value={reference} onChange={e => setReference(e.target.value)}
            placeholder="예: 창1:1-5 출1:1-2" maxLength={2000} required />
          <p className="bp-help">범위: 창1:1-5 · 나열: 창1:1,3,5 · 여러 구절: 창1:1-3 요3:16 (개역한글)</p>
          <details><summary>성경 이름·약자 보기</summary><div className="bp-books">{metadata.books.map(b =>
            <button key={b.abbreviation} type="button" onClick={() => setReference(v => `${v.trim()} ${b.abbreviation}1:1`.trim())}>
              {b.name} ({b.abbreviation})</button>)}</div></details>
          <div className="bp-actions"><label>한 장의 최대 줄 수
            <input type="number" min="0" max="12" required value={lineLimit} onChange={e => setLineLimit(e.target.value)} /></label>
            <span className="bp-help">0은 분할 없음 · 한 번에 최대 200장</span>
            <button className="bp-primary" disabled={!reference.trim()}>{busy === 'build' ? '만드는 중…' : '슬라이드 만들기'}</button>
          </div><p className="bp-help">다시 만들면 현재 슬라이드 편집 내용이 새 구절로 바뀝니다.</p>
        </fieldset>
      </form>
      {slides.length > 0 && <div className="bp-workspace">
        <section className="bp-panel bp-list"><h2>2. 슬라이드 <small>{slides.length}장</small></h2>
          <div className="bp-actions"><button disabled={selected.length < 2 || !!busy} onClick={merge}>선택 합치기</button>
            <button disabled={!current?.parts || !!busy} onClick={split}>원래대로 나누기</button></div>
          <ol>{slides.map((s, i) => <li key={i} className={active === i ? 'is-active' : ''}>
            <input type="checkbox" aria-label={`${i + 1}번 슬라이드 선택`} checked={selected.includes(i)}
              onChange={e => setSelected(e.target.checked ? [...selected, i] : selected.filter(v => v !== i))} />
            <button aria-pressed={active === i} onClick={() => { setActive(i); setIndividual(!!s.style); }}><strong>{i + 1}. {s.title}</strong>
              <span>{s.body}</span>{s.style && <small>개별 설정</small>}</button>
          </li>)}</ol>
        </section>
        <section className="bp-panel bp-editor"><h2>3. 미리보기와 편집</h2>
          <p className="bp-help">실제 PPT로 그린 미리보기입니다. 점선 상자를 끌어 위치를 바꿀 수 있습니다.</p>
          <div ref={previewRef} className="bp-preview" style={{ aspectRatio: `${metadata.width}/${metadata.height}` }}>
            {preview && <img src={preview} alt={`${active + 1}번 슬라이드 미리보기`} draggable="false" />}
            {previewBusy && <span className="bp-preview-status" role="status">미리보기 만드는 중…</span>}
            {previewError && <span className="bp-preview-status" role="alert">{previewError}</span>}
            {['title', 'body'].map(box => <div key={box} className="bp-drag" title={`${box === 'title' ? '제목' : '본문'} 위치 이동`}
              style={{ left: `${style[box].x / metadata.width * 100}%`, top: `${style[box].y / metadata.height * 100}%`,
                width: `${style[box].width / metadata.width * 100}%`, height: `${style[box].height / metadata.height * 100}%` }}
              onPointerDown={e => startDrag(e, box)} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }}
              onPointerCancel={() => { drag.current = null; }} />)}
          </div>
          <label>슬라이드 제목<input maxLength={500} value={current.title} onChange={e => updateCurrent({ title: e.target.value })} /></label>
          <label>본문<textarea rows="5" maxLength={8000} value={current.body} onChange={e => updateCurrent({ body: e.target.value })} /></label>
          {current.parts && <p className="bp-help">‘원래대로 나누기’를 누르면 합치기 전 내용으로 돌아갑니다.</p>}
          <label className="bp-check"><input type="checkbox" checked={individual} onChange={e => setIndividual(e.target.checked)} />
            크기·위치를 이 슬라이드에만 적용</label>
          {current.style && <button onClick={() => updateCurrent({ style: null })}>이 슬라이드의 개별 설정 해제</button>}
          <p className="bp-help">전체 설정은 개별 설정이 없는 슬라이드에 적용됩니다.</p>
          <div className="bp-style-grid">{['title', 'body'].map(box => <fieldset key={box}><legend>{box === 'title' ? '제목' : '본문'} 설정 (pt)</legend>
            <label>글자 크기<input type="number" min="8" max="120" step="1" value={Number(style[`${box}FontSize`].toFixed(1))}
              onChange={e => updateStyle({ ...style, [`${box}FontSize`]: Math.max(8, Math.min(120, Number(e.target.value))) })} /></label>
            {['x', 'y', 'width', 'height'].map(key => <label key={key}>{{ x: '가로 위치', y: '세로 위치', width: '상자 너비', height: '상자 높이' }[key]}
              <input type="number" step="1" min={key === 'x' || key === 'y' ? 0 : 1} value={Number(style[box][key].toFixed(1))}
                onChange={e => {
                  const b = { ...style[box], [key]: Number(e.target.value) };
                  b.width = Math.max(1, Math.min(metadata.width, b.width)); b.height = Math.max(1, Math.min(metadata.height, b.height));
                  b.x = Math.max(0, Math.min(metadata.width - b.width, b.x)); b.y = Math.max(0, Math.min(metadata.height - b.height, b.y));
                  updateStyle({ ...style, [box]: b });
                }} /></label>)}</fieldset>)}</div>
          <div className="bp-actions"><button onClick={() => {
            try { localStorage.setItem(STYLE_KEY, JSON.stringify(globalStyle)); setNotice('전체 설정을 이 브라우저에 저장했습니다.'); }
            catch { setError('이 브라우저에 설정을 저장할 수 없습니다.'); }
          }}>전체 설정 저장</button><button onClick={() => {
            setGlobalStyle(clone(metadata.defaultStyle)); setSlides(slides.map(s => ({ ...s, style: null })));
            setNotice('전체 슬라이드를 템플릿 기본 설정으로 초기화했습니다.');
          }}>템플릿 기본값으로 초기화</button></div>
          <p className="bp-help">발표용 PC에도 Pretendard Black 글꼴이 설치되어 있어야 같은 모습으로 표시됩니다.</p>
          <p className="bp-help">편집한 슬라이드는 페이지를 벗어나면 사라집니다. 작업을 마치면 PPT를 다운로드해 주세요.</p>
        </section>
      </div>}
    </>}
  </main>;
}
