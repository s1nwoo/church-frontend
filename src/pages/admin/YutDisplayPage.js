import React, { useRef } from 'react';
import Board from '../../features/yut/Board';
import TeamSummary from '../../features/yut/TeamSummary';
import FinishedPieces from '../../features/yut/FinishedPieces';
import useYutGame from '../../features/yut/useYutGame';
import useFullscreen from '../../features/yut/useFullscreen';
import Setup from '../../features/yut/Setup';
import '../../features/yut/yut.css';
import '../../features/yut/display.css';

export default function YutDisplayPage() {
  const root = useRef(null);
  const { game, presentation, selected, error } = useYutGame({ readOnly: true });
  const showingSetup = presentation?.phase === 'setup';
  const selectedTeam = game?.teams[selected?.team];
  const selectedPiece = selectedTeam?.pieces[selected?.piece];
  const fullscreen = useFullscreen(root);
  return <main ref={root} className={`yut-app yut-display ${showingSetup ? 'yut-display-setup' : ''} ${game?.mode === 'individual' ? 'yut-individual' : ''} ${game?.teams.length > 4 ? 'yut-many-players' : ''}`}>
    <button className="yut-display-fullscreen" onClick={fullscreen.toggle}>전체 화면</button>
    {(error || fullscreen.error) && <p role="alert" className="yut-warning">{error || fullscreen.error}</p>}
    {showingSetup ? <Setup key={JSON.stringify(presentation.game)} initialGame={presentation.game} readOnly /> : game ? <><div className="yut-display-layout">
      <FinishedPieces game={game} selected={selected} />
      <div className="yut-display-board"><Board game={game} selected={selected} readOnly /></div>
      <TeamSummary game={game} selected={selected} />
    </div>
      <p className={`yut-display-update ${selectedPiece ? 'yut-selection-notice' : ''}`} role="status" aria-live="polite">{selectedPiece
        ? `${selectedTeam.name} · ${selected.piece + 1}번 말 선택 중${selectedPiece.position === null ? ' · 대기석에서 출발' : ''}` : game.log[0]}</p>
    </> : <div className="yut-empty"><h1>경기 준비 중</h1><p>관리자 화면에서 경기를 시작하면 윷판이 여기에 표시됩니다.</p></div>}
  </main>;
}
