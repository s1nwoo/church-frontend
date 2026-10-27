export const TEAM_PALETTE = [
  { name: '파랑', value: '#1255e8' },
  { name: '빨강', value: '#e62932' },
  { name: '초록', value: '#168342' },
  { name: '보라', value: '#8435d6' },
  { name: '주황', value: '#ff8a19' },
  { name: '분홍', value: '#f49bc5' },
  { name: '청록', value: '#35d5db' },
  { name: '갈색', value: '#75452c' },
  { name: '노랑', value: '#f5d52b' },
  { name: '검정', value: '#292b32' },
];

export function uniqueTeamColors(choices) {
  const used = new Set();
  return choices.map(choice => {
    const color = TEAM_PALETTE.some(c => c.value === choice) && !used.has(choice)
      ? choice : TEAM_PALETTE.find(c => !used.has(c.value)).value;
    used.add(color);
    return color;
  });
}

export function teamInk(color) {
  const rgb = color.slice(1).match(/.{2}/g).map(v => parseInt(v, 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722 > .179 ? '#172332' : '#ffffff';
}
