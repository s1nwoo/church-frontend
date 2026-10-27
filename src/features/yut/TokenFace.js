import React from 'react';

export default function TokenFace({ team, piece, count = 1 }) {
  return <>
    {Array.from({ length: count - 1 }, (_, index) => <span key={index} aria-hidden="true"
      className="yut-stack-layer" style={{ '--rise': `${index * 20}%`, zIndex: index }} />)}
    <span className={`yut-token-face ${count > 1 ? 'yut-token-top' : ''}`} style={{ '--rise': `${(count - 1) * 20}%` }}>
      <b>{team + 1}</b><small>{piece + 1}번</small>
    </span>
  </>;
}
