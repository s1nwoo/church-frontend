import React, { useEffect, useState } from 'react';
import { createGame, DEFAULT_NAMES } from './engine';
import { TEAM_PALETTE, teamInk, uniqueTeamColors } from './palette';
export default function Setup({ onStart, onCancel, initialGame, onDraftChange, readOnly = false }) {
  const [count, setCount] = useState(initialGame?.teams.length || 2);
  const [mode, setMode] = useState(initialGame?.mode || 'team');
  const individual = mode === 'individual';
  const [pieces, setPieces] = useState(initialGame?.mode === 'individual' ? 4 : initialGame?.teams[0].pieces.length || 4);
  const [nameSets, setNameSets] = useState(() => ({
    team: DEFAULT_NAMES.map((name, i) => initialGame?.mode !== 'individual' ? initialGame?.teams[i]?.name || name : name),
    individual: TEAM_PALETTE.map((_, i) => initialGame?.mode === 'individual' ? initialGame?.teams[i]?.name || `${i + 1}번 참가자` : `${i + 1}번 참가자`),
  }));
  const names = nameSets[mode];
  const [colors, setColors] = useState(() => uniqueTeamColors(TEAM_PALETTE.map((color, i) => initialGame?.teams[i]?.color || color.value)));
  const unit = individual ? '번 참가자' : '팀';
  useEffect(() => {
    onDraftChange?.(createGame(names.slice(0, count), pieces, colors, mode));
  }, [names, count, pieces, colors, mode, onDraftChange]);
  return <section className="yut-setup yut-card"><h1>윷놀이 경기 설정</h1>
    <p>{readOnly ? '관리자가 경기를 설정하고 있습니다. 경기 시작 후 윷판으로 전환됩니다.' : '경기 방식을 골라 주세요. 실제 윷을 던진 뒤 관리자가 말을 직접 옮깁니다.'}</p>
    <form onSubmit={e => { e.preventDefault(); onStart(createGame(names.slice(0, count), pieces, colors, mode)); }}>
      <fieldset className="yut-setup-fields" disabled={readOnly}>
      <fieldset className="yut-mode"><legend>경기 방식</legend>{[{ value: 'team', label: '팀전' }, { value: 'individual', label: '개인전' }].map(option => <label key={option.value}>
        <input type="radio" name="game-mode" checked={mode === option.value} onChange={() => { setMode(option.value); if (option.value === 'team') setCount(Math.min(count, 4)); }} />{option.label}
      </label>)}</fieldset>
      <div className="yut-form-row"><label>{individual ? '참가 인원' : '참가 팀'}<select value={count} onChange={e => { setCount(Number(e.target.value)); setColors(uniqueTeamColors); }}>{Array.from({ length: individual ? 9 : 3 }, (_, i) => i + 2).map(n => <option key={n} value={n}>{n}{individual ? '명' : '팀'}</option>)}</select></label>
        {individual ? <p className="yut-individual-help">한 사람당 말 1개<br />대기 말이 없어 잉태 효과는 적용되지 않습니다.</p> : <label>팀마다 말<select value={pieces} onChange={e => setPieces(Number(e.target.value))}>{[2, 3, 4].map(n => <option key={n} value={n}>{n}개</option>)}</select></label>}</div>
      <div className="yut-team-inputs">{names.slice(0, count).map((name, i) => <div key={i}>
        <label><span style={{ color: colors[i] }}>{i + 1}{unit}</span>
          <input aria-label={`${i + 1}${unit} 이름`} value={name} maxLength={12} onChange={e => setNameSets(current => ({ ...current, [mode]: names.map((v, index) => index === i ? e.target.value : v) }))} /></label>
        <fieldset className="yut-colors"><legend>{i + 1}{unit} 말 색상</legend>
          {TEAM_PALETTE.map(color => <label key={color.value}
            className={!readOnly && colors.slice(0, count).some((chosen, index) => index !== i && chosen === color.value) ? 'yut-color-taken' : undefined}
            title={!readOnly && colors.slice(0, count).some((chosen, index) => index !== i && chosen === color.value) ? `${color.name} · 다른 ${individual ? '참가자' : '팀'} 사용 중` : color.name}>
            <input type="radio" name={`team-color-${i}`} aria-label={`${i + 1}${unit} ${color.name}`} checked={colors[i] === color.value}
              disabled={colors.slice(0, count).some((chosen, index) => index !== i && chosen === color.value)}
              onChange={() => setColors(current => current.map((value, index) => index === i ? color.value : value))} />
            <span style={{ background: color.value, color: teamInk(color.value) }} aria-hidden="true">{colors[i] === color.value ? '✓' : ''}</span>
          </label>)}
        </fieldset>
      </div>)}</div>
      </fieldset>
      {!readOnly && <button className="yut-primary" type="submit">{onCancel ? '기존 경기를 지우고 시작' : '경기 시작'}</button>}
      {!readOnly && onCancel && <button type="button" onClick={onCancel}>현재 경기로 돌아가기</button>}
    </form>
  </section>;
}
