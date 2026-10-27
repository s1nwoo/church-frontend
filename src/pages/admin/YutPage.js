import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Board from '../../features/yut/Board';
import Setup from '../../features/yut/Setup';
import Rules from '../../features/yut/Rules';
import TeamSummary from '../../features/yut/TeamSummary';
import PieceControls from '../../features/yut/PieceControls';
import FinishedPieces from '../../features/yut/FinishedPieces';
import usePieceDrag from '../../features/yut/usePieceDrag';
import useYutGame from '../../features/yut/useYutGame';
import useFullscreen from '../../features/yut/useFullscreen';
import BirthChoice from '../../features/yut/BirthChoice';
import { birthCandidates } from '../../features/yut/engine';
import '../../features/yut/yut.css';
import '../../features/yut/display.css';

export default function YutPage() {
  const { game, showSetup, setPresentation, selected, setSelected, place, setSpecial, start, undo, canUndo, undoCount, error } = useYutGame();
  const [setup, setSetup] = useState(false);
  const [pendingBirth, setPendingBirth] = useState(null);
  const drag = usePieceDrag(requestPlace, setSelected, setSpecial);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const root = useRef(null);
  const fullscreen = useFullscreen(root);
  useEffect(() => {
    if (game && !setup) setPresentation({ phase: 'game' });
  }, [game, setup, setPresentation]);
  function requestPlace(selection, position) {
    const candidates = birthCandidates(game, selection, position);
    if (candidates.length) setPendingBirth({ game, selection, position, candidates });
    else place(selection, position);
  }
  function placeSelected(position) {
    if (!selected) return;
    requestPlace(selected, position); setSelected(null);
  }
  function openDisplay() {
    const display = window.open('/admin/yut/display', 'bhbc-yut-projector', 'popup=yes,width=1280,height=800');
    setPopupBlocked(!display);
    display?.focus();
  }
  return <main ref={root} className={`yut-app ${game?.mode === 'individual' ? 'yut-individual' : ''} ${game?.teams.length > 4 ? 'yut-many-players' : ''}`}>
    <header className="yut-header"><div><Link to="/admin">← 관리자 메뉴</Link><h1>윷놀이 관리</h1></div>
      <nav aria-label="경기 화면"><button className="yut-primary" onClick={openDisplay}>빔 화면 열기 ↗</button>
        <button onClick={fullscreen.toggle}>전체 화면</button>{game && <button onClick={() => setSetup(true)}>새 경기</button>}</nav>
    </header>
    {(error || fullscreen.error) && <p role="alert" className="yut-warning">{error || fullscreen.error}</p>}
    {popupBlocked && <p role="alert" className="yut-warning">새 창이 차단되었습니다. <a href="/admin/yut/display" target="_blank" rel="noreferrer">빔 화면 직접 열기</a></p>}
    {!game || setup ? <Setup initialGame={game} onDraftChange={showSetup} onStart={next => { start(next); setSetup(false); setSelected(null); }}
      onCancel={game ? () => setSetup(false) : null} /> : <>
      <TeamSummary game={game} />
      <div className={`yut-layout yut-manager-layout ${drag.dragging ? 'yut-dragging' : ''}`}>
        <FinishedPieces game={game} drag={drag} selected={selected} />
        <section className="yut-stage">
          <div className="yut-board-toolbar"><p>{selected ? '원하는 칸에 놓아 주세요' : '말을 끌어 원하는 칸에 놓으세요'}</p>
            <button disabled={!selected} onClick={() => setSelected(null)}>선택 취소</button></div>
          <Board game={game} selected={selected} onSelect={setSelected} onPlace={placeSelected} drag={drag} />
          <div className="yut-undo-bar"><button disabled={!canUndo} onClick={() => { undo(); setSelected(null); }}>↶ 말 배치 되돌리기</button>
            <span>{undoCount ? `최근 ${undoCount}회 배치까지 복원 가능` : '말을 놓으면 되돌릴 수 있습니다'}</span></div>
          <p className="yut-announcement" role="status" aria-live="polite">{game.log[0]}</p>
        </section>
        <PieceControls game={game} drag={drag} selected={selected} onSelect={setSelected} setSpecial={setSpecial} />
      </div>
      <details className="yut-history"><summary>말 배치 기록</summary><ol>{game.log.map((line, i) => <li key={i}>{line}</li>)}</ol></details>
    </>}
    <Rules />
    {pendingBirth?.game === game && game && <BirthChoice team={game.teams[pendingBirth.selection.team]} candidates={pendingBirth.candidates}
      onChoose={index => { place(pendingBirth.selection, pendingBirth.position, index); setPendingBirth(null); }}
      onCancel={() => { setPendingBirth(null); setSelected(null); }} />}
  </main>;
}
