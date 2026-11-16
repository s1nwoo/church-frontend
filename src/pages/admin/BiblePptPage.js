import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { isAdminUser } from '../../utils/auth';
import { getAccessToken } from '../../utils/authSession';
import AdminBackButton from '../../components/AdminBackButton';
import BibleVersePicker from './BibleVersePicker';
import SlideSplitDialog from './SlideSplitDialog';
import { openProjectorChannel, projectorAction, PROJECTOR_PATH, PROJECTOR_WIDTH, PROJECTOR_WINDOW } from './bibleProjector';
import './BiblePptPage.css';

// 슬라이드마다 고유 번호를 붙여, 합치기·나누기·끼워 넣기 후에도 송출 중인 슬라이드를 따라간다.
let slideSeq = 0;
const withIds = list => list.map(s => ({ ...s, id: ++slideSeq }));
const renderKey = (slide, style) => JSON.stringify([slide.title, slide.body, slide.style || style]);
// 프로젝터 창을 노트북이 아닌 다른 모니터로 옮긴다. 권한이 없거나 지원하지 않으면 사용자가 직접 끌어 옮긴다.
async function moveToOtherScreen(win) {
  try {
    if (typeof window.getScreenDetails !== 'function') return;
    const { screens, currentScreen } = await window.getScreenDetails();
    const other = screens.find(s => s !== currentScreen && !s.isPrimary) || screens.find(s => s !== currentScreen);
    if (other && !win.closed) { win.moveTo(other.availLeft, other.availTop); win.resizeTo(other.availWidth, other.availHeight); }
  } catch { /* 직접 옮기면 된다. */ }
}
// 크기 조절 손잡이: 끄는 쪽 변만 움직이고 반대쪽 변은 고정한다. 상자는 슬라이드 밖으로 나가지 않는다.
const MIN_BOX = 20;
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const clampTo = (value, min, max) => Math.max(min, Math.min(max, value));
function resizeBox(b, mode, dx, dy, pageWidth, pageHeight) {
  let { x, y, width, height } = b;
  if (mode.includes('e')) width = clampTo(width + dx, MIN_BOX, pageWidth - x);
  if (mode.includes('s')) height = clampTo(height + dy, MIN_BOX, pageHeight - y);
  if (mode.includes('w')) { const right = x + width; x = clampTo(x + dx, 0, right - MIN_BOX); width = right - x; }
  if (mode.includes('n')) { const bottom = y + height; y = clampTo(y + dy, 0, bottom - MIN_BOX); height = bottom - y; }
  return { x, y, width, height };
}
function typingTarget(target) {
  if (!target || target.isContentEditable) return !!target;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || !!target.closest?.('dialog, [role=dialog]');
}

const API = '/api/admin/bible-ppt';
const STYLE_KEY = 'banghwa-bible-ppt-style-v1';
// 입력한 구절로 만든 슬라이드 목록은 이 브라우저에 자동 저장해 새로고침·실수로 창을 닫아도 남아 있게 한다.
const SLIDES_KEY = 'banghwa-bible-ppt-slides-v1';
const MAX_SLIDES = 200;
// 떠 있는 슬라이드 목록 위젯의 위치·크기·접힘 상태 (이 브라우저에만 기억)
const WIDGET_KEY = 'banghwa-bible-ppt-widget-v1';
// 위젯 썸네일 보기: 서버가 실제 PPT와 같은 방식으로 그린 작은 그림(가로 400px)을 쓴다.
const THUMB_WIDTH = 400;
const THUMB_SIZES = [140, 180, 220, 280, 360];   // 크기 슬라이더 1~5단계의 카드 최소 폭(px)
const THUMB_CONCURRENCY = 3;
// 성경 송출: 설교 중 오래 손대지 않아도 로그아웃되지 않도록 10분마다 로그인을 연장한다.
// 마지막으로 조작한 뒤 최대 6시간까지만 연장한다(노트북을 두고 자리를 비운 경우 대비).
const KEEPALIVE_EVERY = 10 * 60 * 1000;
const KEEPALIVE_MAX = 6 * 60 * 60 * 1000;
// 빔 화면이 연결되면 목록의 모든 슬라이드를 미리 그려 노트북에 보관한다(로그아웃·인터넷 끊김에도 넘길 수 있게).
const PRERENDER_CONCURRENCY = 2;
const RENDER_CACHE_MAX = 400;
function formatLeft(ms) {
  const minutes = Math.max(0, Math.ceil(ms / 60000)), h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h}시간${m ? ` ${m}분` : ''}` : `${m}분`;
}
function loadWidget() {
  try {
    const w = JSON.parse(localStorage.getItem(WIDGET_KEY));
    return w && typeof w === 'object' ? w : {};
  } catch { return {}; }
}
// 슬라이드 id도 함께 저장한다. 성경 PPT 만들기·성경 송출 두 메뉴(또는 두 탭)가 같은 목록을 공유할 때
// 같은 슬라이드를 계속 알아봐야 송출 중인 슬라이드가 끊기지 않는다.
const toStored = s => ({ id: s.id, title: s.title, body: s.body, ...(s.style ? { style: s.style } : {}), ...(s.parts ? { parts: s.parts.map(toStored) } : {}) });
const fromStored = s => {
  const id = Number.isInteger(s.id) && s.id > 0 ? s.id : ++slideSeq;
  slideSeq = Math.max(slideSeq, id);
  return { ...s, id, ...(s.parts ? { parts: s.parts.map(fromStored) } : {}) };
};
function parseStoredSlides(text) {
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return [];
    return data.filter(s => s && typeof s.title === 'string' && typeof s.body === 'string').slice(0, MAX_SLIDES).map(fromStored);
  } catch { return []; }
}
function loadSlides() {
  try { return parseStoredSlides(localStorage.getItem(SLIDES_KEY)); } catch { return []; }
}
// 저장된 전체 글자 크기·위치 설정이 이 템플릿에서 쓸 수 있는 값인지 확인한다.
function validStyle(saved, page) {
  const validBox = b => b && ['x', 'y', 'width', 'height'].every(k => Number.isFinite(b[k]))
    && b.x >= 0 && b.y >= 0 && b.width >= 1 && b.height >= 1 && b.x + b.width <= page.width && b.y + b.height <= page.height;
  return !!saved && ['titleFontSize', 'bodyFontSize'].every(k => Number.isFinite(saved[k]) && saved[k] >= 8 && saved[k] <= 120)
    && validBox(saved.title) && validBox(saved.body);
}
const PPT_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const headers = () => ({ Authorization: `Bearer ${sessionStorage.getItem('accessToken') || ''}` });
const clone = value => JSON.parse(JSON.stringify(value));
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
async function errorMessage(error) {
  if (error.response?.status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  if (error.response?.status === 403) return '이 계정에는 관리자 권한이 없습니다.';
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

/** 관리자 메뉴 ‘성경 PPT 만들기’: 예배 전 준비(성경 검색·구절 입력·미리보기 편집·PPT 저장). 빔 화면 송출 기능은 없다. */
export default function BiblePptPage() {
  return <BibleSlideStudio mode="ppt" />;
}

/**
 * 성경 슬라이드 작업 화면. 두 관리자 메뉴가 같은 슬라이드 목록(이 브라우저에 저장)을 공유한다.
 * - mode="ppt": 성경 PPT 만들기 — 성경 검색, 구절 입력, 떠 있는 슬라이드 목록, 실제 미리보기 편집, PPT 저장
 * - mode="broadcast": 성경 송출 — 화면 위쪽 전체에 슬라이드 목록, 맨 아래에 빔 화면 송출 패널(구절 입력 포함)
 */
export function BibleSlideStudio({ mode = 'ppt' }) {
  const broadcast = mode === 'broadcast';
  const { user, login } = useContext(AuthContext);
  const adminNow = isAdminUser(user);
  // 성경 송출은 들어올 때만 관리자 확인을 한다. 송출 중에 로그인이 끊겨도(만료·다른 탭에서 로그아웃) 화면을 닫지 않고
  // 미리 그려 둔 슬라이드로 계속 넘길 수 있게 하며, 그 자리에서 다시 로그인하도록 안내한다.
  const wasAdmin = useRef(false);
  if (adminNow) wasAdmin.current = true;
  const admin = adminNow || (broadcast && wasAdmin.current);
  const sessionLost = broadcast && admin && !adminNow;
  const [metadata, setMetadata] = useState(null), [globalStyle, setGlobalStyle] = useState(null);
  const [reference, setReference] = useState(''), [lineLimit, setLineLimit] = useState('');
  const [search, setSearch] = useState(''), [book, setBook] = useState(null), [pickerBook, setPickerBook] = useState(null);
  const [initialSlides] = useState(loadSlides);
  const [slides, setSlides] = useState(initialSlides), [active, setActive] = useState(0), [selected, setSelected] = useState([]);
  const [individual, setIndividual] = useState(false), [saving, setSaving] = useState(false), [adding, setAdding] = useState(false);
  const [validation, setValidation] = useState(''), [focusId, setFocusId] = useState(null);
  const [error, setError] = useState(''), [filename, setFilename] = useState('');
  const [notice, setNotice] = useState(initialSlides.length ? `이전에 작업하던 슬라이드 ${initialSlides.length}장을 불러왔습니다.` : '');
  const [preview, setPreview] = useState(''), [previewBusy, setPreviewBusy] = useState(false), [previewError, setPreviewError] = useState('');
  const [retry, setRetry] = useState(0);
  const previewRef = useRef(null), referenceRef = useRef(null), listRef = useRef(null), drag = useRef(null), selectionAnchor = useRef(0);
  const [splitTarget, setSplitTarget] = useState(null);   // 나누기 창을 연 슬라이드 id
  // 슬라이드 목록 모드: null(보통) · 'cut'(카드를 누르면 나누기 창) · 'delete'(카드를 누르면 삭제)
  const [listMode, setListMode] = useState(null);
  const lastDeleteAt = useRef(0);
  const splitSlide = splitTarget == null ? null : slides.find(s => s.id === splitTarget);
  // 나누기 창의 결과 미리보기: 그 슬라이드의 제목·스타일 그대로 실제 송출 화면처럼 그린다.
  const splitTitle = splitSlide?.title, splitStyle = splitSlide?.style || globalStyle;
  const renderSplitPart = useCallback(body => axios.post(`${API}/preview`, { title: splitTitle, body, style: splitStyle },
    { headers: headers(), params: { width: 640 }, responseType: 'blob' }).then(r => r.data), [splitTitle, splitStyle]);
  // 빔 화면 송출 상태: 편집 중인 슬라이드(active)와 송출 중인 슬라이드(liveId)는 따로 움직인다.
  const [projectorOpen, setProjectorOpen] = useState(false), [projectorError, setProjectorError] = useState('');
  const [liveId, setLiveId] = useState(null), [black, setBlack] = useState(false), [resend, setResend] = useState(0);
  const [liveImage, setLiveImage] = useState(''), [liveError, setLiveError] = useState('');
  const [autoSend, setAutoSend] = useState(true);
  // 로그인 유지: keepUntil까지 자동 연장한다(조작할 때마다 6시간 뒤로 미룸). clock은 남은 시간 표시용.
  const keepUntil = useRef(Date.now() + KEEPALIVE_MAX), lastRenew = useRef(Date.now());
  const [clock, setClock] = useState(() => Date.now());
  // 미리 그려 둔 송출 그림(내용별 key)과 다시 시도 신호. 로그인이 끊겼을 때 그 자리에서 다시 로그인하는 칸.
  const readyKeys = useRef(new Set()), [, setPrepTick] = useState(0), [prepRetry, setPrepRetry] = useState(0);
  const [relogin, setRelogin] = useState({ username: '', password: '', busy: false, error: '' });
  // 슬라이드 목록 위젯: 지운 목록 되돌리기, 끌어서 순서 이동, 위젯 위치·크기·접힘
  const [undo, setUndo] = useState(null), [dropAt, setDropAt] = useState(null), [dragFrom, setDragFrom] = useState(null);
  const [widget, setWidget] = useState(loadWidget), [tip, setTip] = useState(null), [ghost, setGhost] = useState(null);
  const sortDrag = useRef(null), dropRef = useRef(null), suppressClick = useRef(false), moveRef = useRef(null);
  const widgetRef = useRef(null), widgetDrag = useRef(null);
  const ready = !!(metadata && globalStyle);
  // 성경 송출 메뉴: 송출 패널은 화면 맨 아래에 고정하고, 슬라이드 목록은 그 위 전체를 채운다.
  const inCompact = broadcast && ready;
  const [liveHeight, setLiveHeight] = useState(0);
  const liveRef = useRef(null);
  // 썸네일: 내용(제목·본문·스타일)별 그림 주소. null이면 불러오기 실패.
  const [thumbs, setThumbs] = useState({}), [thumbTick, setThumbTick] = useState(0);
  const thumbUrls = useRef(new Map()), thumbBusy = useRef(new Set()), thumbFailed = useRef(new Set()), visibleThumbs = useRef(null);
  const thumbMode = widget.view === 'thumb', thumbView = thumbMode && !widget.collapsed && ready;
  const thumbSize = clampTo(Number(widget.thumb) || 3, 1, THUMB_SIZES.length);
  const thumbOf = slide => (globalStyle ? thumbs[renderKey(slide, globalStyle)] : undefined);
  const channel = useRef(null), projectorWin = useRef(null), renders = useRef(new Map()), keyAction = useRef(null), latest = useRef({});
  const current = slides[active], style = current?.style || globalStyle;
  const editStyle = individual && current ? style : globalStyle;
  const liveIndex = slides.findIndex(s => s.id === liveId), live = slides[liveIndex];
  latest.current = { slides, liveId, projectorOpen };
  const canSave = slides.length > 0 && !saving;
  const suggestedName = `${(slides[0]?.title || '성경말씀').replace(/[^가-힣\w,:~-]+/g, '_').slice(0, 60)}${
    slides.length > 1 ? `_외${slides.length - 1}장` : ''}_${today()}.pptx`;

  useEffect(() => {
    if (!admin) return;
    const controller = new AbortController(); setError('');
    axios.get(`${API}/metadata`, { headers: headers(), signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      setMetadata(data);
      let saved;
      try { saved = JSON.parse(localStorage.getItem(STYLE_KEY)); } catch { /* Template defaults. */ }
      setGlobalStyle(validStyle(saved, data) ? saved : data.defaultStyle);
    }).catch(async e => { if (!controller.signal.aborted) setError(await errorMessage(e)); });
    return () => controller.abort();
  }, [admin, retry]);

  // 카드 끌기: 마우스를 어디로 움직여도 따라가도록 창(window)에서 받는다.
  useEffect(() => {
    const move = event => {
      const drag = sortDrag.current;
      if (!drag) return;
      if (!drag.dragging) {
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
        drag.dragging = true; setDragFrom(drag.from);
        // 잡은 지점이 카드 안에서 그대로 유지되도록 카드 모서리와 마우스 사이 간격을 기억한다.
        const r = drag.el.getBoundingClientRect();
        drag.offX = drag.x - r.left; drag.offY = drag.y - r.top;
        setGhost({ title: drag.title, thumb: drag.thumb, width: r.width, height: r.height });
      }
      event.preventDefault?.();
      // 잡은 카드(떠 있는 카드)가 마우스를 따라 움직인다.
      setGhost(g => g && { ...g, left: event.clientX - drag.offX, top: event.clientY - drag.offY });
      const row = document.elementFromPoint?.(event.clientX, event.clientY)?.closest?.('.bp-list li[data-index]');
      const target = row ? (() => {
        // 카드가 여러 칸으로 놓여 있으면 좌우(카드 왼쪽/오른쪽 절반), 한 칸이면 위아래로 놓일 자리를 정한다.
        const r = row.getBoundingClientRect();
        const grid = (getComputedStyle(row.parentElement).gridTemplateColumns || '').trim().split(/\s+/).length > 1;
        return { index: Number(row.dataset.index), axis: grid ? 'x' : 'y',
          after: grid ? event.clientX > r.left + r.width / 2 : event.clientY > r.top + r.height / 2 };
      })() : null;
      dropRef.current = target;
      setDropAt(old => old?.index === target?.index && old?.after === target?.after && old?.axis === target?.axis ? old : target);
      // 목록 위·아래 끝에 가까우면 자동으로 스크롤한다.
      const list = listRef.current, box = list?.getBoundingClientRect();
      if (box && event.clientY < box.top + 32) list.scrollTop -= 14;
      else if (box && event.clientY > box.bottom - 32) list.scrollTop += 14;
    };
    const up = () => {
      const drag = sortDrag.current, target = dropRef.current;
      sortDrag.current = null; dropRef.current = null;
      if (!drag?.dragging) return;
      // 끌기가 끝난 직후의 클릭은 ‘편집할 슬라이드 선택’으로 처리하지 않는다.
      suppressClick.current = true; setTimeout(() => { suppressClick.current = false; }, 0);
      setDragFrom(null); setDropAt(null); setGhost(null);
      if (target) moveRef.current?.(drag.from, target.index + (target.after ? 1 : 0));
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, []);

  // 썸네일 보기: 화면(위젯 목록)에 보이는 카드를 추적해 그 카드의 그림부터 받는다.
  useEffect(() => {
    const list = listRef.current;
    if (!thumbView || !list || typeof IntersectionObserver === 'undefined') { visibleThumbs.current = null; return undefined; }
    visibleThumbs.current = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = Number(entry.target.dataset.id);
        if (entry.isIntersecting) visibleThumbs.current?.add(id); else visibleThumbs.current?.delete(id);
      });
      setThumbTick(v => v + 1);
    }, { root: list, rootMargin: '200px' });
    list.querySelectorAll('li[data-id]').forEach(li => observer.observe(li));
    return () => observer.disconnect();
  }, [thumbView, slides]);
  // 썸네일 보기를 다시 켜면 실패했던 그림도 다시 시도한다.
  useEffect(() => { if (thumbView) thumbFailed.current.clear(); }, [thumbView]);
  // 아직 없는 썸네일을 보이는 카드부터 동시에 최대 3장씩 받는다. 한 번 받은 그림은 내용이 같으면 다시 받지 않는다.
  // 본문을 연달아 고치는 동안에는 0.3초 기다렸다가 받는다.
  useEffect(() => {
    if (!thumbView || !globalStyle) return undefined;
    const timer = setTimeout(() => {
      const visible = visibleThumbs.current;
      const pending = slides.filter(s => {
        const key = renderKey(s, globalStyle);
        return !thumbUrls.current.has(key) && !thumbBusy.current.has(key) && !thumbFailed.current.has(key);
      });
      const ordered = visible ? [...pending.filter(s => visible.has(s.id)), ...pending.filter(s => !visible.has(s.id))] : pending;
      for (const slide of ordered) {
        if (thumbBusy.current.size >= THUMB_CONCURRENCY) break;
        const key = renderKey(slide, globalStyle);
        thumbBusy.current.add(key);
        axios.post(`${API}/preview`, { title: slide.title, body: slide.body, style: slide.style || globalStyle },
          { headers: headers(), params: { width: THUMB_WIDTH }, responseType: 'blob' })
          .then(({ data }) => {
            const url = URL.createObjectURL(data);
            thumbUrls.current.set(key, url); setThumbs(t => ({ ...t, [key]: url }));
          })
          .catch(() => { thumbFailed.current.add(key); setThumbs(t => ({ ...t, [key]: null })); })
          .finally(() => { thumbBusy.current.delete(key); setThumbTick(v => v + 1); });
      }
      // 더 이상 목록에 없는 내용의 그림은 메모리에서 정리한다.
      if (thumbUrls.current.size > slides.length + 60) {
        const keep = new Set(slides.map(s => renderKey(s, globalStyle)));
        for (const [key, url] of thumbUrls.current) if (!keep.has(key)) { URL.revokeObjectURL(url); thumbUrls.current.delete(key); }
      }
    }, thumbBusy.current.size ? 0 : 300);
    return () => clearTimeout(timer);
  }, [thumbView, slides, globalStyle, thumbTick]);
  useEffect(() => {
    const urls = thumbUrls.current;
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, []);
  // 나누기·삭제 모드: Esc로 끝내고, 목록이 비면 저절로 끝난다. 모드가 끝나면 삭제 모드 묶음 되돌리기도 마감한다.
  useEffect(() => {
    if (!listMode) { setUndo(u => (u?.deleteMode ? { ...u, deleteMode: false } : u)); return undefined; }
    const onKey = event => { if (event.key === 'Escape' && !event.defaultPrevented) setListMode(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [listMode]);
  useEffect(() => { if (!slides.length) setListMode(null); }, [slides.length]);
  // 카드가 지워지거나 위젯을 접으면 떠 있던 툴팁을 닫는다.
  useEffect(() => { setTip(null); }, [slides, widget.collapsed]);
  // 위젯 위치·크기·접힘 상태를 이 브라우저에 기억한다.
  useEffect(() => { try { localStorage.setItem(WIDGET_KEY, JSON.stringify(widget)); } catch { /* 기억하지 못해도 동작한다. */ } }, [widget]);
  // 창 크기가 바뀌어 위젯이 화면 밖으로 나가면 안쪽으로 되돌린다.
  useEffect(() => {
    const fit = () => setWidget(w => {
      if (w.x == null) return w;
      const width = widgetRef.current?.offsetWidth || 340;
      const x = clampTo(w.x, 0, Math.max(0, window.innerWidth - width)), y = clampTo(w.y, 0, Math.max(0, window.innerHeight - 48));
      return x === w.x && y === w.y ? w : { ...w, x, y };
    });
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [ready]);
  // 오른쪽 아래 모서리로 바꾼 위젯 크기를 기억한다. 송출 모드에서는 화면에 맞춰 자동으로 채우므로 기억하지 않는다.
  useEffect(() => {
    const el = widgetRef.current;
    if (!el || widget.collapsed || broadcast || typeof ResizeObserver === 'undefined') return undefined;
    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setWidget(w => w.w === el.offsetWidth && w.h === el.offsetHeight ? w : { ...w, w: el.offsetWidth, h: el.offsetHeight }), 200);
    });
    observer.observe(el);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [widget.collapsed, ready, broadcast]);
  // 성경 송출: 화면 아래에 고정한 송출 패널의 높이를 재서 슬라이드 목록이 그 위까지만 차지하게 한다.
  useEffect(() => {
    const el = liveRef.current;
    if (!el || !inCompact) return undefined;
    const measure = () => setLiveHeight(Math.ceil(el.getBoundingClientRect().height));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [inCompact]);
  function startWidgetDrag(event) {
    if (broadcast || event.button !== 0 || event.target.closest?.('button, input') || !widgetRef.current) return;
    const r = widgetRef.current.getBoundingClientRect();
    widgetDrag.current = { dx: event.clientX - r.left, dy: event.clientY - r.top };
    event.currentTarget.setPointerCapture?.(event.pointerId); event.preventDefault();
  }
  function moveWidget(event) {
    const drag = widgetDrag.current, el = widgetRef.current;
    if (!drag || !el) return;
    setWidget(w => ({ ...w, x: clampTo(event.clientX - drag.dx, 0, Math.max(0, window.innerWidth - el.offsetWidth)),
      y: clampTo(event.clientY - drag.dy, 0, Math.max(0, window.innerHeight - 48)) }));
  }

  // 목록이 바뀔 때마다 이 브라우저에 저장한다(편집 내용·개별 스타일·합친 슬라이드 포함).
  useEffect(() => {
    try {
      if (slides.length) localStorage.setItem(SLIDES_KEY, JSON.stringify(slides.map(toStored)));
      else localStorage.removeItem(SLIDES_KEY);
    } catch { /* 저장 공간이 없으면 화면에서만 유지한다. */ }
  }, [slides]);

  useEffect(() => {
    setPreview(''); setPreviewError(''); setPreviewBusy(false);
    // 성경 송출 화면에는 실제 미리보기가 없으므로 서버에 그리지 않는다.
    if (!current || !style || !admin || broadcast) return;
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
  }, [current, style, admin, broadcast]);

  // 전체 글자 크기·위치 설정은 바꿀 때마다 이 브라우저에 저장해 성경 송출에서도 같은 모양으로 나가게 한다.
  useEffect(() => {
    if (!globalStyle) return;
    try { localStorage.setItem(STYLE_KEY, JSON.stringify(globalStyle)); } catch { /* 저장하지 못해도 이 화면에서는 동작한다. */ }
  }, [globalStyle]);
  // 다른 탭(성경 PPT 만들기 ↔ 성경 송출)에서 목록이나 설정을 바꾸면 이 화면에도 바로 반영한다.
  // id를 함께 저장하므로 송출 중인 슬라이드를 고치면 빔 화면에도 반영된다.
  useEffect(() => {
    const onStorage = event => {
      if (event.storageArea && event.storageArea !== localStorage) return;
      if (event.key === SLIDES_KEY) {
        const next = parseStoredSlides(event.newValue);
        // 내용이 그대로인 슬라이드는 기존 객체를 유지해, 바뀐 슬라이드만 다시 그리고(송출·썸네일) 나머지는 건드리지 않는다.
        const same = (a, b) => JSON.stringify(toStored(a)) === JSON.stringify(toStored(b));
        setSlides(old => {
          const byId = new Map(old.map(s => [s.id, s]));
          return next.map(s => (byId.has(s.id) && same(byId.get(s.id), s) ? byId.get(s.id) : s));
        });
        setUndo(null); setSelected([]);
        setActive(a => Math.max(0, Math.min(a, next.length - 1)));
      } else if (event.key === STYLE_KEY && metadata) {
        let saved;
        try { saved = JSON.parse(event.newValue); } catch { saved = null; }
        if (validStyle(saved, metadata)) setGlobalStyle(saved);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [metadata]);

  // 빔 화면 창과 연결: 창이 열리거나 새로고침되면(hello) 현재 송출 화면을 다시 보낸다.
  // 빔 화면은 성경 송출 메뉴에서만 조종한다(성경 PPT 만들기 화면은 연결하지 않는다).
  useEffect(() => {
    if (!broadcast) return undefined;
    const ch = openProjectorChannel(); channel.current = ch;
    if (!ch) return undefined;
    ch.onmessage = ({ data }) => {
      if (data?.type === 'hello') { setProjectorOpen(true); setResend(v => v + 1); }
      else if (data?.type === 'bye') setProjectorOpen(false);
      else if (data?.type === 'key') keyAction.current?.(data.action);
    };
    ch.postMessage({ type: 'ping' });
    const timer = setInterval(() => {
      if (projectorWin.current?.closed) { projectorWin.current = null; setProjectorOpen(false); }
    }, 1000);
    return () => { clearInterval(timer); ch.postMessage({ type: 'controller-closed' }); ch.close(); channel.current = null; };
  }, [broadcast]);

  // 같은 내용은 한 번만 그린다. 진행 중인 요청도 공유해 이전/다음 이동이 바로 반영되게 한다.
  const renderSlide = useCallback(slide => {
    const key = renderKey(slide, globalStyle), cache = renders.current;
    if (!cache.has(key)) {
      const request = axios.post(`${API}/preview`, { title: slide.title, body: slide.body, style: slide.style || globalStyle },
        { headers: headers(), params: { width: PROJECTOR_WIDTH }, responseType: 'blob' }).then(r => r.data);
      request.then(() => { if (cache.get(key) === request) { readyKeys.current.add(key); setPrepTick(v => v + 1); } },
        () => { if (cache.get(key) === request) cache.delete(key); });
      cache.set(key, request);
      if (cache.size > RENDER_CACHE_MAX) { const oldest = cache.keys().next().value; cache.delete(oldest); readyKeys.current.delete(oldest); }
    }
    return cache.get(key);
  }, [globalStyle]);

  // 송출 중인 슬라이드가 바뀌거나 수정되면 빔 화면을 갱신한다. 실패하면 빔 화면은 이전 화면을 유지한다.
  useEffect(() => {
    if (!live || !projectorOpen || !admin) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const blob = await renderSlide(live);
        if (cancelled) return;
        channel.current?.postMessage({ type: 'show', image: blob }); setLiveError('');
        setLiveImage(old => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
      } catch (e) { if (!cancelled) setLiveError(await errorMessage(e)); }
    }, renders.current.has(renderKey(live, globalStyle)) ? 0 : 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [live, projectorOpen, renderSlide, globalStyle, resend, admin]);

  // 다음·이전 슬라이드를 미리 그려 둔다.
  useEffect(() => {
    if (liveIndex < 0 || !projectorOpen) return undefined;
    const timer = setTimeout(() => [1, -1, 2].forEach(d => {
      const next = slides[liveIndex + d]; if (next) renderSlide(next).catch(() => {});
    }), 500);
    return () => clearTimeout(timer);
  }, [liveIndex, slides, projectorOpen, renderSlide]);

  // 빔 화면이 연결되어 있으면 목록 전체를 미리 그려 둔다. 송출 중인 슬라이드부터 뒤쪽, 그다음 앞쪽 순서로 동시에 2장씩.
  // 이미 그린 슬라이드는 다시 그리지 않고, 로그인이 끊긴 동안에는 쉬었다가 다시 로그인하면 이어서 그린다.
  useEffect(() => {
    if (!broadcast || !projectorOpen || !globalStyle || sessionLost) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      const { slides: list, liveId: onAir } = latest.current;
      const liveAt = list.findIndex(s => s.id === onAir), start = liveAt >= 0 ? liveAt : 0;
      const queue = [...list.slice(start), ...list.slice(0, start).reverse()]
        .filter(s => !readyKeys.current.has(renderKey(s, globalStyle)));
      const worker = async () => {
        while (!cancelled && queue.length) {
          try { await renderSlide(queue.shift()); } catch { /* 실패한 장은 다음 기회에 다시 그린다. */ }
        }
      };
      for (let i = 0; i < PRERENDER_CONCURRENCY; i += 1) worker();
    }, 800);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [broadcast, projectorOpen, slides, globalStyle, sessionLost, renderSlide, prepRetry]);
  // 인터넷이 다시 연결되면 못 그린 슬라이드를 이어서 그린다.
  useEffect(() => {
    if (!broadcast) return undefined;
    const online = () => setPrepRetry(v => v + 1);
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, [broadcast]);

  // 로그인 유지(성경 송출): 이 화면이나 빔 화면 창에서 조작할 때마다 자동 연장 기한을 6시간 뒤로 미루고,
  // 1분마다 확인해 마지막 연장 후 10분이 지났으면 로그인을 연장한다. 실패하면 다음 확인 때 다시 시도한다.
  useEffect(() => {
    if (!broadcast) return undefined;
    const touch = () => { keepUntil.current = Date.now() + KEEPALIVE_MAX; };
    document.addEventListener('pointerdown', touch, true); document.addEventListener('keydown', touch, true);
    return () => { document.removeEventListener('pointerdown', touch, true); document.removeEventListener('keydown', touch, true); };
  }, [broadcast]);
  const username = user?.username;
  useEffect(() => {
    if (!broadcast || !adminNow) return undefined;
    lastRenew.current = Date.now();
    let busy = false;
    const tick = async () => {
      const now = Date.now(), token = getAccessToken();
      setClock(now);
      if (busy || !token || now > keepUntil.current || now - lastRenew.current < KEEPALIVE_EVERY) return;
      busy = true;
      try {
        const { data } = await axios.post('/api/auth/renew', null, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
        // 그사이 다른 계정으로 바뀌었거나 이미 새 토큰을 받았으면 덮어쓰지 않는다.
        if (getAccessToken() === token && data?.accessToken && data.username === username) { login?.(data); lastRenew.current = Date.now(); }
      } catch { /* 다음 확인(1분 뒤) 때 다시 시도한다. */ }
      finally { busy = false; }
    };
    const timer = setInterval(tick, 60 * 1000);
    return () => clearInterval(timer);
  }, [broadcast, adminNow, username, login]);
  // 다시 로그인하면 실패했던 송출·썸네일·미리 그리기를 이어서 한다.
  const firstSession = useRef(true);
  useEffect(() => {
    if (firstSession.current) { firstSession.current = false; return; }
    if (sessionLost) return;
    setLiveError(''); setResend(v => v + 1); setPrepRetry(v => v + 1);
    thumbFailed.current.clear(); setThumbTick(v => v + 1);
    keepUntil.current = Date.now() + KEEPALIVE_MAX; setClock(Date.now());
  }, [sessionLost]);
  async function submitRelogin(event) {
    event.preventDefault();
    if (relogin.busy) return;
    setRelogin(r => ({ ...r, busy: true, error: '' }));
    try {
      const { data } = await axios.post('/api/auth/login', { username: relogin.username, password: relogin.password });
      if (!isAdminUser(data)) { setRelogin(r => ({ ...r, busy: false, error: '관리자 계정으로 로그인해 주세요.' })); return; }
      login(data);
      setRelogin({ username: '', password: '', busy: false, error: '' });
    } catch {
      setRelogin(r => ({ ...r, busy: false, error: '아이디 또는 비밀번호를 확인해 주세요.' }));
    }
  }

  useEffect(() => { if (projectorOpen) channel.current?.postMessage({ type: 'black', on: black }); }, [black, projectorOpen, resend]);
  // 넘길 때마다(또는 구절을 추가하면) 해당 슬라이드가 목록 가운데에 보이도록 목록 상자 안에서만 스크롤한다(페이지는 움직이지 않음).
  const scrollIntoList = useCallback(id => {
    const list = listRef.current, row = id == null ? null : list?.querySelector(`li[data-id="${id}"]`);
    if (!row) return;
    const top = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
    if (typeof list.scrollTo === 'function') list.scrollTo({ top, behavior: 'smooth' }); else list.scrollTop = top;
  }, []);
  useEffect(() => { if (projectorOpen) scrollIntoList(liveId); }, [liveId, projectorOpen, scrollIntoList]);
  useEffect(() => { scrollIntoList(focusId); }, [focusId, scrollIntoList]);
  useEffect(() => () => setLiveImage(old => { if (old) URL.revokeObjectURL(old); return ''; }), []);

  function goLive(index) {
    if (!slides[index]) return;
    setLiveId(slides[index].id); setBlack(false);
  }
  function step(delta) {
    if (!slides.length) return;
    goLive(liveIndex < 0 ? Math.min(active, slides.length - 1) : Math.max(0, Math.min(slides.length - 1, liveIndex + delta)));
  }
  keyAction.current = action => {
    keepUntil.current = Date.now() + KEEPALIVE_MAX;   // 빔 화면 창에서 누른 키도 조작으로 본다.
    if (action === 'next') step(1); else if (action === 'prev') step(-1); else if (action === 'black') setBlack(v => !v);
  };
  // 빔 화면이 켜져 있을 때 프레젠터(클리커)·키보드로 넘긴다. 글자를 입력하는 중에는 동작하지 않는다.
  useEffect(() => {
    if (!projectorOpen) return undefined;
    const onKey = event => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || typingTarget(event.target)) return;
      if (event.key === ' ' && ['BUTTON', 'A', 'SUMMARY'].includes(event.target?.tagName)) return;
      const action = projectorAction(event);
      if (action) { event.preventDefault(); keyAction.current(action); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [projectorOpen]);

  function openProjector() {
    setProjectorError('');
    const win = window.open(PROJECTOR_PATH, PROJECTOR_WINDOW, 'popup,width=960,height=720');
    if (!win) { setProjectorError('팝업이 차단되었습니다. 주소창 오른쪽의 팝업 차단 아이콘에서 이 사이트를 허용한 뒤 다시 눌러 주세요.'); return; }
    projectorWin.current = win; moveToOtherScreen(win);
  }
  function closeProjector() {
    if (projectorWin.current && !projectorWin.current.closed) projectorWin.current.close();
    else channel.current?.postMessage({ type: 'close' });
    projectorWin.current = null; setProjectorOpen(false);
  }
  // 입력한 구절을 목록에 추가한다. 기존 슬라이드와 편집 내용은 그대로 둔다.
  // 송출 중이면 송출 중인 슬라이드 바로 뒤에, 아니면 맨 뒤에 넣는다.
  async function addReference(text) {
    const ref = text.trim(), limit = Number(lineLimit);
    if (!ref || adding) return false;
    if (!Number.isInteger(limit) || limit < 0 || limit > 12) { setValidation('줄 수는 비워 두거나 0~12 사이의 정수로 입력해 주세요.'); return false; }
    setAdding(true); setValidation(''); setNotice('');
    try {
      const { data } = await axios.post(`${API}/slides`, { reference: ref, lineLimit: limit }, { headers: headers() });
      const added = withIds(data), { slides: now, liveId: nowLive, projectorOpen: onAir } = latest.current;
      if (now.length + added.length > MAX_SLIDES) {
        setValidation(`목록은 최대 ${MAX_SLIDES}장까지입니다. 지금 ${now.length}장이라 ${added.length}장을 더 넣을 수 없습니다.`); return false;
      }
      // ‘추가하면 바로 송출’이 켜져 있고 송출 중일 때만 송출 중인 슬라이드 바로 뒤에 넣는다. 그 밖에는 목록 맨 뒤.
      const liveAt = onAir && autoSend ? now.findIndex(s => s.id === nowLive) : -1, at = liveAt >= 0 ? liveAt + 1 : now.length;
      setSlides([...now.slice(0, at), ...added, ...now.slice(at)]); setUndo(null);
      setActive(at); setSelected([]); setIndividual(false); selectionAnchor.current = at; setFocusId(added[0].id);
      if (autoSend && onAir) { setLiveId(added[0].id); setBlack(false); }
      setNotice(`${ref} → 슬라이드 ${added.length}장을 ${at === now.length ? '맨 뒤' : `${at + 1}번째`}에 추가했습니다.`);
      return true;
    } catch (e) { setValidation(await errorMessage(e)); return false; }
    finally { setAdding(false); }
  }
  async function submitReference(event) {
    event.preventDefault();
    if (await addReference(reference)) setReference('');
  }
  // 지운 직전 목록을 기억해 ‘되돌리기’로 살릴 수 있게 한다. 목록이 다른 이유로 바뀌면 되돌리기는 사라진다.
  function removeAt(targets, message) {
    if (!targets.length) return;
    const next = slides.filter((_, i) => !targets.includes(i)), activeId = current?.id;
    const keep = next.findIndex(s => s.id === activeId);
    setUndo({ slides, active, message }); setSlides(next); setSelected([]);
    setActive(keep >= 0 ? keep : Math.max(0, Math.min(Math.min(...targets), next.length - 1)));
  }
  // 삭제 모드에서 카드를 누르면 지운다. 이 모드에서 연달아 지운 것은 ‘되돌리기’ 한 번으로 모드를 켜기 전 상태까지 되돌린다.
  // 빠르게 두 번 눌러 다음 카드까지 지워지지 않도록 0.35초 안의 연속 클릭은 무시한다.
  function removeInDeleteMode(index) {
    const now = Date.now();
    if (now - lastDeleteAt.current < 350 || !slides[index]) return;
    lastDeleteAt.current = now;
    const target = slides[index], next = slides.filter((_, i) => i !== index), activeId = current?.id;
    const keep = next.findIndex(s => s.id === activeId);
    setUndo(u => {
      const count = u?.deleteMode ? u.count + 1 : 1;
      const message = count > 1 ? `${count}장을 지웠습니다.` : `‘${target.title}’을(를) 지웠습니다.`;
      return u?.deleteMode ? { ...u, count, message } : { slides, active, deleteMode: true, count, message };
    });
    setSlides(next); setSelected([]);
    setActive(keep >= 0 ? keep : Math.max(0, Math.min(index, next.length - 1)));
  }
  function clearSlides() {
    if (!slides.length || !window.confirm(`슬라이드 ${slides.length}장을 모두 지울까요?`)) return;
    removeAt(slides.map((_, i) => i), `목록을 비웠습니다(${slides.length}장).`);
  }
  function undoRemove() {
    if (!undo) return;
    setSlides(undo.slides); setActive(undo.active); setSelected([]); setUndo(null);
  }
  // 목록 안에서 순서 이동: from 위치의 슬라이드를 to 위치(원래 배열 기준, 그 앞)에 넣는다.
  function moveSlide(from, to) {
    const insert = to > from ? to - 1 : to;
    if (insert === from || !slides[from]) return;
    const activeId = slides[active]?.id, selectedIds = selected.map(i => slides[i]?.id);
    const next = [...slides], [item] = next.splice(from, 1);
    next.splice(insert, 0, item);
    setSlides(next); setUndo(null);
    setActive(Math.max(0, next.findIndex(s => s.id === activeId)));
    setSelected(selectedIds.map(id => next.findIndex(s => s.id === id)).filter(i => i >= 0));
  }
  moveRef.current = moveSlide;
  // 카드를 6px 이상 끌면 순서 이동, 그보다 적게 움직이면 보통 클릭(편집할 슬라이드 선택)으로 본다.
  function cardPointerDown(event, index) {
    setTip(null);
    if (event.button !== 0 || saving || event.target.closest?.('input, .bp-row-live')) return;
    sortDrag.current = { from: index, x: event.clientX, y: event.clientY, dragging: false,
      el: event.currentTarget, title: slides[index]?.title, thumb: thumbView && slides[index] ? thumbOf(slides[index]) : undefined };
  }
  // 카드에 마우스를 올리면 바로 본문 툴팁을 띄운다(브라우저 기본 툴팁은 1초쯤 늦게 떠서 직접 그린다).
  // 카드 아래에 띄우고, 화면 아래쪽이 모자라면 카드 위에 띄운다.
  function showTip(event, slide) {
    if (thumbView || sortDrag.current?.dragging || !slide.body) return;   // 썸네일 보기에서는 그림으로 보이므로 툴팁이 필요 없다.
    const r = event.currentTarget.getBoundingClientRect(), width = Math.min(380, window.innerWidth - 16);
    const left = clampTo(r.left, 8, Math.max(8, window.innerWidth - width - 8));
    setTip(r.bottom + 170 > window.innerHeight
      ? { text: slide.body, left, width, bottom: window.innerHeight - r.top + 6 }
      : { text: slide.body, left, width, top: r.bottom + 6 });
  }

  const updateCurrent = patch => { setUndo(null); setSlides(old => old.map((s, i) => i === active ? { ...s, ...patch } : s)); };
  const updateStyle = next => {
    if (individual && current) updateCurrent({ style: next }); else setGlobalStyle(next);
    setNotice('');
  };
  const editFont = (box, value) => updateStyle({ ...editStyle, [`${box}FontSize`]: Math.max(8, Math.min(120, Number(value))) });
  function chooseSlide(event, index) {
    if (suppressClick.current) return;
    // 나누기 모드: 나누기 창을 연다 · 삭제 모드: 그 카드를 지운다.
    if (listMode === 'cut') { setTip(null); setSplitTarget(slides[index]?.id ?? null); return; }
    if (listMode === 'delete') { setTip(null); removeInDeleteMode(index); return; }
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
    const merged = { id: ++slideSeq, title: composeTitle(group), body: group.map(s => s.body).join('\n'),
      parts: group.flatMap(s => s.parts || [s]), style: group[0].style };
    setSlides(slides.flatMap((s, i) => i === indices[0] ? [merged] : indices.includes(i) ? [] : [s]));
    setActive(indices[0]); setSelected([indices[0]]); setUndo(null);
    if (group.some(s => s.id === liveId)) setLiveId(merged.id);
  }
  // 긴 구절을 원하는 곳에서 여러 장으로 나눈다. 모든 장이 같은 제목·개별 스타일을 쓰고,
  // 송출 중이었다면 첫 장이 계속 송출 상태로 남는다(같은 id 유지). ‘되돌리기’로 되돌릴 수 있다.
  function splitSlideInto(slideId, bodies) {
    const index = slides.findIndex(s => s.id === slideId), target = slides[index];
    const parts = bodies.map(b => b.trim()).filter(Boolean);
    if (!target || parts.length < 2) return false;
    const { parts: mergedParts, ...rest } = target;   // 직접 나눈 뒤에는 ‘합치기 전으로 나누기’ 정보가 맞지 않으므로 버린다.
    const pieces = parts.map((body, i) => ({ ...rest, ...(i ? { id: ++slideSeq } : {}), body }));
    setUndo({ slides, active, message: `‘${target.title}’을(를) ${pieces.length}장으로 나눴습니다.` });
    setSlides(slides.flatMap((s, i) => i === index ? pieces : [s]));
    setActive(index); setSelected([]); setFocusId(pieces[0].id);
    setNotice(`‘${target.title}’을(를) ${pieces.length}장으로 나눴습니다.`);
    return true;
  }
  function split() {
    if (current.id === liveId) setLiveId(current.parts[0].id);
    setSlides(slides.flatMap((s, i) => i === active ? s.parts : [s])); setSelected([active]); setUndo(null);
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
      setNotice('PPT 파일을 저장했습니다.');
    } catch (e) { if (e.name !== 'AbortError') setError(await errorMessage(e)); }
    finally { setSaving(false); }
  }
  // mode: 'move'(상자 안쪽을 끌어 이동) 또는 손잡이 방향 'n','s','e','w','ne','nw','se','sw'(크기 조절)
  function startDrag(event, box, mode = 'move') {
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture?.(event.pointerId);
    const onlyThis = !!current?.style || individual; if (onlyThis) setIndividual(true);
    drag.current = { box, mode, x: event.clientX, y: event.clientY, style: clone(style), onlyThis };
  }
  function moveDrag(event) {
    if (!drag.current || !previewRef.current) return;
    const { box, mode, x, y, style: initial, onlyThis } = drag.current, rect = previewRef.current.getBoundingClientRect(), b = initial[box];
    const dx = (event.clientX - x) * metadata.width / rect.width, dy = (event.clientY - y) * metadata.height / rect.height;
    const moved = mode === 'move' ? { ...b,
      x: Math.max(0, Math.min(metadata.width - b.width, b.x + dx)),
      y: Math.max(0, Math.min(metadata.height - b.height, b.y + dy)) } : resizeBox(b, mode, dx, dy, metadata.width, metadata.height);
    const next = { ...initial, [box]: moved };
    if (onlyThis) updateCurrent({ style: next }); else setGlobalStyle(next);
  }

  // 위젯을 끌어 옮겼거나 모서리로 크기를 바꾼 적이 있으면 그 값을 쓰고, 아니면 CSS 기본값(오른쪽 위)을 쓴다.
  const widgetStyle = { ...(widget.x != null ? { left: widget.x, top: widget.y, right: 'auto' } : {}),
    ...(!widget.collapsed && widget.w && widget.h ? { width: widget.w, height: widget.h } : {}) };
  const pageTitle = broadcast ? '성경 송출' : '성경 PPT 만들기';
  // 송출 준비: 목록 중 빔 화면용 그림을 미리 그려 둔 장 수
  const prepTotal = broadcast && projectorOpen && globalStyle ? slides.length : 0;
  const prepared = prepTotal ? slides.filter(s => readyKeys.current.has(renderKey(s, globalStyle))).length : 0;
  if (!admin) return <main className="bible-ppt page-container"><AdminBackButton /><h1>{pageTitle}</h1>
    <p>관리자 로그인 후 이용할 수 있습니다.</p><Link to="/login">로그인하기</Link></main>;
  // 성경 송출에서는 알림·오류를 화면 아래 송출 패널 안에 보여 준다(페이지 위쪽은 슬라이드 목록이 차지한다).
  const messages = <>
    {error && <div role="alert" className="bp-error">{error}{!metadata && <button onClick={() => setRetry(v => v + 1)}>다시 불러오기</button>}</div>}
    {notice && <p role="status" className="bp-notice">{notice}</p>}
  </>;
  // 구절 입력: 성경 송출에서는 송출 패널 안, 성경 PPT 만들기에서는 성경 검색 아래에 놓는다. 줄 수 제한은 PPT 만들기에만 있다.
  const referenceFields = <>
    <form className="bp-add" onSubmit={submitReference}>
      <label className="bp-sr-only" htmlFor="bp-reference">성경 구절</label>
      <div className="bp-add-row">
        <input ref={referenceRef} id="bp-reference" value={reference} disabled={saving} readOnly={adding} aria-invalid={!!validation}
          aria-describedby="bp-validation bp-reference-help" onChange={e => { setReference(e.target.value); setValidation(''); }}
          placeholder="예: 창세기 1:1-5 요3:16" maxLength={2000} />
        {!broadcast && <>
          <label className="bp-limit-label" htmlFor="bp-line-limit">줄 수 제한</label>
          <input id="bp-line-limit" className="bp-limit-input" type="number" min="0" max="12" value={lineLimit} disabled={saving}
            onChange={e => { setLineLimit(e.target.value); setValidation(''); }} placeholder="없음" />
        </>}
        <button type="submit" className="bp-primary" disabled={!reference.trim() || saving || adding || sessionLost}>{adding ? '추가 중…' : '목록에 추가'}</button>
      </div>
      {broadcast && projectorOpen && <label className="bp-check"><input type="checkbox" checked={autoSend} onChange={e => setAutoSend(e.target.checked)} />추가하면 바로 송출</label>}
    </form>
    <p id="bp-validation" className={`bp-validation ${validation ? 'is-invalid' : ''}`} role={validation ? 'alert' : 'status'}>{validation}</p>
    <p id="bp-reference-help" className="bp-help">창1:1-5 · 창세기 1:1,3,5 · 요한복음3:16 (약어·전체 이름 모두 가능, 개역개정) · Enter를 누르면 슬라이드 목록에 계속 쌓이고 이 브라우저에 자동 저장됩니다.
      {broadcast && projectorOpen && autoSend ? ' 지금 송출 중인 슬라이드 바로 뒤에 넣고 바로 송출합니다.' : ' 목록 맨 뒤에 추가합니다.'}</p>
  </>;
  return <main className={`bible-ppt page-container ${broadcast ? 'is-broadcast' : ''} ${projectorOpen ? 'is-live-mode' : ''} ${inCompact ? 'is-compact' : ''}`}
    style={inCompact ? { '--bp-live-h': `${liveHeight}px` } : undefined}>
    <div className="bp-heading"><div><AdminBackButton /><h1>{pageTitle}</h1></div>
      <p>{broadcast ? '예배 중 빔 프로젝터로 성경 구절을 띄웁니다.'
        : '구절을 목록에 쌓아 두고 미리보기로 다듬은 뒤 PPT로 저장하세요. 예배 중 띄우기는 관리자 메뉴의 ‘성경 송출’에서 합니다.'}</p></div>
    {!inCompact && messages}
    {!ready ? !error && <p>성경 데이터와 템플릿을 불러오는 중입니다.</p> : <>
      {broadcast && <section ref={liveRef} className={`bp-panel bp-live ${projectorOpen ? 'is-on' : ''}`} aria-labelledby="bp-live-heading">
        {inCompact && messages}
        <div className="bp-live-head">
          <h2 id="bp-live-heading">빔 화면 송출 <span className="bp-live-state" role="status">{projectorOpen ? '● 연결됨' : '꺼짐'}</span></h2>
          <div className="bp-live-head-actions">
            <Link className="bp-link-button" to="/admin">관리자 메뉴</Link>
            {/* 로그인은 탭마다 sessionStorage에 있으므로, window.open으로 열어야 새 탭에 지금 로그인이 복사된다(일반 새 탭 링크는 로그아웃 상태로 열린다). */}
            <button type="button" className="bp-link-button" onClick={() => window.open('/admin/bible-ppt', '_blank')}
              title="새 탭에서 열립니다. 거기서 고친 글자 크기·본문은 이 화면과 빔 화면에도 바로 반영됩니다.">성경 PPT 만들기 (새 탭)</button>
            {projectorOpen ? <button onClick={closeProjector}>빔 화면 닫기</button>
              : <button className="bp-primary" onClick={openProjector}>빔 화면 열기</button>}
          </div>
        </div>
        {sessionLost ? <div className="bp-session-lost" role="alert">
          <p><strong>로그인이 만료됐습니다.</strong> {prepTotal ? `미리 그려 둔 슬라이드(${prepared}/${prepTotal}장)는 계속 넘길 수 있습니다.` : '빔 화면에 띄운 화면은 그대로 유지됩니다.'}
            {' '}구절 추가·새 슬라이드 송출은 다시 로그인해야 합니다.</p>
          <form className="bp-relogin" onSubmit={submitRelogin}>
            <input aria-label="아이디" autoComplete="username" placeholder="아이디" value={relogin.username}
              onChange={e => setRelogin(r => ({ ...r, username: e.target.value, error: '' }))} />
            <input aria-label="비밀번호" type="password" autoComplete="current-password" placeholder="비밀번호" value={relogin.password}
              onChange={e => setRelogin(r => ({ ...r, password: e.target.value, error: '' }))} />
            <button type="submit" className="bp-primary" disabled={relogin.busy || !relogin.username.trim() || !relogin.password}>
              {relogin.busy ? '로그인 중…' : '다시 로그인'}</button>
          </form>
          {relogin.error && <p className="bp-validation is-invalid">{relogin.error}</p>}
        </div> : <p className="bp-session">
          {keepUntil.current > clock ? `로그인 유지 중 · 앞으로 ${formatLeft(keepUntil.current - clock)} 자동 연장 (화면을 조작하면 다시 6시간)`
            : '자동 연장 시간이 지났습니다. 화면을 한 번 누르면 다시 6시간 동안 로그인을 유지합니다.'}
          {prepTotal > 0 && <span className={`bp-prep ${prepared >= prepTotal ? 'is-done' : ''}`}>
            {prepared >= prepTotal ? ` · 송출 준비 완료 ${prepTotal}장 (인터넷이 끊겨도 넘길 수 있음)` : ` · 송출 준비 ${prepared}/${prepTotal}장`}</span>}
        </p>}
        {projectorError && <p role="alert" className="bp-validation is-invalid">{projectorError}</p>}
        <div className="bp-live-body">
          <div className="bp-live-screen" style={{ aspectRatio: `${metadata.width}/${metadata.height}` }}>
            {liveImage ? <img src={liveImage} alt="지금 빔 화면에 나가는 슬라이드" className={black ? 'is-black' : ''} /> : <span>송출 전</span>}
            {black && <span className="bp-live-black">검은 화면</span>}
          </div>
          <div className="bp-live-controls">
            <p className="bp-live-now">{!projectorOpen ? '‘빔 화면 열기’를 누르고, 열린 창을 프로젝터 화면으로 옮겨 더블클릭하면 전체 화면이 됩니다.'
              : live ? <>지금 송출: <strong>{live.title}</strong></>
              : liveId ? '송출하던 슬라이드가 목록에서 바뀌었습니다. 빔 화면에는 마지막 화면이 그대로 나갑니다.'
              : '아직 송출한 슬라이드가 없습니다. 목록에서 ‘송출’을 누르거나 → 키를 누르세요.'}</p>
            {liveError && <p role="alert" className="bp-validation is-invalid">{liveError} 빔 화면에는 이전 화면이 그대로 나갑니다.</p>}
            <div className="bp-live-buttons">
              <button disabled={!projectorOpen || !slides.length} onClick={() => step(-1)}>◀ 이전</button>
              <button disabled={!projectorOpen || !slides.length} onClick={() => step(1)}>다음 ▶</button>
              <button aria-pressed={black} disabled={!projectorOpen} onClick={() => setBlack(v => !v)}>{black ? '화면 다시 켜기' : '검은 화면'}</button>
            </div>
            <p className="bp-help">단축키(빔 화면이 켜져 있을 때): → · PageDown · Space 다음 / ← · PageUp 이전 / B 검은 화면 — 프레젠터(클리커)도 사용할 수 있습니다.</p>
            <div className="bp-reference">
              <h3>구절 입력</h3>
              {referenceFields}
            </div>
          </div>
        </div>
      </section>}
      <section ref={widgetRef} style={inCompact ? undefined : widgetStyle} aria-labelledby="bp-list-heading"
        className={`bp-list bp-widget ${widget.collapsed ? 'is-collapsed' : ''} ${dragFrom != null ? 'is-sorting' : ''}`}>
        <div className="bp-widget-head" title={broadcast ? '화면 위쪽을 자동으로 채웁니다 · 더블클릭하면 접기/펼치기' : '끌어서 옮기기 · 더블클릭하면 접기/펼치기'} onPointerDown={startWidgetDrag} onPointerMove={moveWidget}
          onPointerUp={() => { widgetDrag.current = null; }} onPointerCancel={() => { widgetDrag.current = null; }}
          onDoubleClick={e => { if (!e.target.closest('button, input')) setWidget(w => ({ ...w, collapsed: !w.collapsed })); }}>
          <h2 id="bp-list-heading">슬라이드 목록 <small>{slides.length}장</small></h2>
          {widget.collapsed && live && <span className="bp-widget-live">송출 중: {live.title}</span>}
          {!widget.collapsed && <>
            {thumbMode && <input type="range" className="bp-thumb-size" min="1" max={THUMB_SIZES.length} step="1" value={thumbSize} aria-label="썸네일 크기"
              title="썸네일 크기" onChange={e => setWidget(w => ({ ...w, thumb: Number(e.target.value) }))} />}
            <div className="bp-view-toggle" role="group" aria-label="목록 보기 방식">
              <button type="button" aria-pressed={!thumbMode} onClick={() => setWidget(w => ({ ...w, view: 'title' }))}>제목</button>
              <button type="button" aria-pressed={thumbMode} onClick={() => setWidget(w => ({ ...w, view: 'thumb' }))}>썸네일</button>
            </div>
          </>}
          <button type="button" className="bp-widget-toggle" aria-expanded={!widget.collapsed} aria-label={widget.collapsed ? '목록 펼치기' : '목록 접기'}
            onClick={() => setWidget(w => ({ ...w, collapsed: !w.collapsed }))}>{widget.collapsed ? '▢' : '—'}</button>
        </div>
        {!widget.collapsed && <>
          <div className="bp-list-actions">
            <button disabled={selected.length < 2 || !canSave} onClick={merge}>합치기</button>
            {!broadcast && <button disabled={!current?.parts || !canSave} onClick={split} title="합친 슬라이드를 합치기 전으로 되돌립니다">합치기 풀기</button>}
            <button type="button" className="bp-mode-cut" aria-pressed={listMode === 'cut'} disabled={!slides.length || saving}
              onClick={() => setListMode(m => (m === 'cut' ? null : 'cut'))}>✂ 나누기 모드</button>
            <button type="button" className="bp-mode-delete" aria-pressed={listMode === 'delete'} disabled={!slides.length || saving}
              onClick={() => setListMode(m => (m === 'delete' ? null : 'delete'))}>✕ 삭제 모드</button>
            <button className="bp-danger" disabled={!slides.length || saving} onClick={clearSlides}>비우기</button>
          </div>
          {listMode && <div className={`bp-mode-banner is-${listMode}`} role="status">
            <span>{listMode === 'cut' ? '나누기 모드: 나눌 구절 카드를 누르세요.' : '삭제 모드: 지울 카드를 누르세요. 잘못 지우면 ‘되돌리기’를 누르세요.'}</span>
            <button type="button" onClick={() => setListMode(null)}>끝내기 (Esc)</button>
          </div>}
          {undo && <div className="bp-undo" role="status">{undo.message}<button type="button" onClick={undoRemove}>되돌리기</button></div>}
          <ol ref={listRef} onScroll={() => setTip(null)} className={`${thumbView ? 'is-thumb' : ''} ${listMode ? `mode-${listMode}` : ''}`}
            style={thumbView ? { '--bp-card-min': `${THUMB_SIZES[thumbSize - 1]}px` } : undefined}>{slides.length ? slides.map((s, i) => <li key={s.id ?? i} data-id={s.id} data-index={i}
            aria-current={liveIndex === i ? 'true' : undefined}
            onPointerDown={e => cardPointerDown(e, i)} onPointerEnter={e => showTip(e, s)} onPointerLeave={() => setTip(null)}
            className={`${active === i ? 'is-active' : ''} ${selected.includes(i) ? 'is-selected' : ''} ${liveIndex === i ? 'is-live' : ''} ${dragFrom === i ? 'is-dragging' : ''} ${
              dropAt?.index === i && dragFrom !== i ? `${dropAt.after ? 'drop-after' : 'drop-before'} drop-${dropAt.axis}` : ''}`}>
            {thumbView && <div className="bp-thumb" aria-hidden="true" style={{ aspectRatio: `${metadata.width}/${metadata.height}` }}
              onClick={e => chooseSlide(e, i)} onDoubleClick={projectorOpen && !listMode ? () => goLive(i) : undefined}>
              {thumbOf(s) ? <img src={thumbOf(s)} alt="" draggable="false" />
                : <span>{thumbOf(s) === null ? '미리보기를 불러오지 못했습니다' : '불러오는 중…'}</span>}
            </div>}
            <span className="bp-grip" aria-hidden="true">⋮⋮</span>
            <input type="checkbox" aria-label={`${i + 1}번 슬라이드 선택`} checked={selected.includes(i)} disabled={saving}
              onChange={e => { selectionAnchor.current = i; setSelected(e.target.checked ? [...selected, i] : selected.filter(v => v !== i)); }} />
            <button className="bp-slide-main" aria-pressed={active === i} disabled={saving} onClick={e => chooseSlide(e, i)}
              aria-label={listMode === 'cut' ? `${s.title} 나누기` : listMode === 'delete' ? `${s.title} 삭제` : undefined}
              onDoubleClick={projectorOpen && !listMode ? () => goLive(i) : undefined}><strong>{s.title}{s.style ? ' ★' : ''}</strong></button>
            {projectorOpen && <button className="bp-row-live" aria-label={`${i + 1}번 슬라이드 송출`} disabled={liveIndex === i} onClick={() => goLive(i)}>송출</button>}
          </li>) : <li className="bp-empty-list">‘빔 화면 송출’의 구절 입력에 성경 구절을 넣고 Enter를 누르면 여기에 쌓입니다.</li>}</ol>
          <p className="bp-help bp-widget-help">카드를 끌어 순서 변경 · 긴 구절은 ✂ 나누기 모드, 지울 때는 ✕ 삭제 모드 · Ctrl/Shift로 여러 장 선택 · 오른쪽 아래 모서리를 끌어 크기 조절(넓히면 여러 칸으로 보입니다)
            {thumbMode && ' · 썸네일을 클릭하면 편집, 더블클릭하면 송출'}</p>
        </>}
      </section>
      {ghost && <div className="bp-drag-ghost" aria-hidden="true"
        style={{ left: ghost.left, top: ghost.top, width: ghost.width, minHeight: ghost.height }}>
        {ghost.thumb && <img className="bp-ghost-thumb" src={ghost.thumb} alt="" />}
        <span className="bp-grip">⋮⋮</span><strong>{ghost.title}</strong></div>}
      {tip && <div role="tooltip" className="bp-tip" style={{ left: tip.left, width: tip.width, top: tip.top, bottom: tip.bottom }}>{tip.text}</div>}
      {!broadcast && <><div className="bp-studio"><div className="bp-input-column">
        <section className="bp-panel bp-search"><h2>성경 검색</h2>
          <label className="bp-sr-only" htmlFor="bp-book-search">성경 검색</label>
          <input id="bp-book-search" placeholder="성경 이름이나 약자를 검색하세요" value={search} disabled={saving} onChange={e => setSearch(e.target.value)} />
          <p className="bp-help">성경을 더블클릭하거나 선택 후 ‘장·절 선택’을 누르세요. 고른 구절은 바로 슬라이드 목록에 추가됩니다.</p>
          <div className="bp-book-list" role="listbox" aria-label="성경 목록">{metadata.books.filter(b => `${b.name} ${b.abbreviation}`.includes(search.trim())).map(b =>
            <button type="button" role="option" aria-selected={book?.abbreviation === b.abbreviation} key={b.abbreviation} disabled={saving}
              onClick={() => setBook(b)} onDoubleClick={() => setPickerBook(b)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setPickerBook(b); } }}>
              {b.name} <span>({b.abbreviation})</span></button>)}</div>
          <button className="bp-book-select" disabled={!book || saving} onClick={() => setPickerBook(book)}>장·절 선택</button>
        </section>
        <section className="bp-panel bp-reference bp-reference-panel"><h2>구절 입력</h2>{referenceFields}</section>
      </div>
      <section className="bp-panel bp-editor"><h2>실제 미리보기</h2><p className="bp-help">제목·본문 상자 안쪽을 끌면 위치를 옮기고, 모서리·테두리의 네모 점을 끌면 상자 크기를 바꿉니다.</p>
        {projectorOpen && current && <p className={`bp-live-note ${liveIndex === active ? 'is-live' : ''}`}>{liveIndex === active
          ? '지금 송출 중인 슬라이드입니다. 고치면 빔 화면에도 바로 반영됩니다.' : '편집만 하는 중입니다. 빔 화면에는 나가지 않습니다.'}</p>}
        <fieldset disabled={saving} className="bp-controls">{['title', 'body'].map(box => <div className="bp-slider-row" key={box}>
          <label htmlFor={`bp-${box}-slider`}>{box === 'title' ? '제목' : '본문'} 크기</label>
          <input id={`bp-${box}-slider`} type="range" min="8" max="120" step="1" value={editStyle[`${box}FontSize`]} onChange={e => editFont(box, e.target.value)} />
          <label className="bp-sr-only" htmlFor={`bp-${box}-size`}>{box === 'title' ? '제목' : '본문'} 크기 직접 입력</label>
          <input id={`bp-${box}-size`} type="number" min="8" max="120" step="1" value={Number(editStyle[`${box}FontSize`].toFixed(1))} onChange={e => editFont(box, e.target.value)} /><span>pt</span>
        </div>)}<label className="bp-check"><input type="checkbox" disabled={!current} checked={individual} onChange={e => setIndividual(e.target.checked)} />이 슬라이드에만 적용</label></fieldset>
        {current?.style && <button className="bp-text-button" disabled={saving} onClick={() => updateCurrent({ style: null })}>이 슬라이드의 개별 설정 해제</button>}
        <div ref={previewRef} className="bp-preview" style={{ aspectRatio: `${metadata.width}/${metadata.height}` }} aria-label="슬라이드 미리보기 영역">
          {preview && <img src={preview} alt={`${active + 1}번 슬라이드 미리보기`} draggable="false" />}
          {!current && <div className="bp-preview-empty"><strong>말씀 슬라이드 미리보기</strong><span>위쪽 ‘구절 입력’에서 성경 구절을 추가해 주세요.</span></div>}
          {previewBusy && <span className="bp-preview-status" role="status">미리보기 만드는 중…</span>}{previewError && <span className="bp-preview-status" role="alert">{previewError}</span>}
          {current && ['title', 'body'].map(box => <div key={box} className={`bp-drag bp-drag-${box}`} title={`${box === 'title' ? '제목' : '본문'} 상자: 안쪽을 끌면 이동, 모서리·테두리의 점을 끌면 크기 조절`}
            style={{ left: `${style[box].x / metadata.width * 100}%`, top: `${style[box].y / metadata.height * 100}%`, width: `${style[box].width / metadata.width * 100}%`,
              height: `${style[box].height / metadata.height * 100}%`, pointerEvents: saving ? 'none' : undefined }} onPointerDown={e => startDrag(e, box)} onPointerMove={moveDrag}
            onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}><span>{box === 'title' ? '제목' : '본문'}</span>
            {HANDLES.map(dir => <i key={dir} className={`bp-handle bp-handle-${dir}`} aria-hidden="true" onPointerDown={e => startDrag(e, box, dir)} />)}</div>)}
        </div>
        <div className="bp-style-actions"><button disabled={saving} onClick={() => {
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
      <p className="bp-help bp-footer-note">목록 최대 200장 · 줄 수 제한을 비우면 분할 없음 · 글자 크기·위치 설정은 바꿀 때마다 자동 저장되어 성경 송출에도 쓰입니다.<br />저장 위치 선택을 지원하지 않는 브라우저에서는 다운로드 폴더에 저장됩니다. 발표용 PC에는 Pretendard Black 글꼴을 설치해 주세요.</p>
      </>}
    </>}
    {pickerBook && <BibleVersePicker book={pickerBook} onClose={() => setPickerBook(null)} onAdd={token => {
      setPickerBook(null); addReference(token);
    }} />}
    {splitSlide && <SlideSplitDialog key={splitSlide.id} slide={splitSlide} onCancel={() => setSplitTarget(null)}
      aspect={metadata ? `${metadata.width}/${metadata.height}` : '4/3'} renderPart={renderSplitPart}
      onSplit={bodies => { splitSlideInto(splitSlide.id, bodies); setSplitTarget(null); }} />}
  </main>;
}
