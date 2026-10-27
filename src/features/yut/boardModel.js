export const POINTS = {};
for (let i = 1; i <= 20; i += 1) {
  POINTS[i] = i <= 5 ? [504, 504 - i * 81.6] : i <= 10 ? [504 - (i - 5) * 81.6, 96]
    : i <= 15 ? [96, 96 + (i - 10) * 81.6] : [96 + (i - 15) * 81.6, 504];
}
Object.assign(POINTS, {
  a: [436, 164], b: [368, 232], center: [300, 300], c: [232, 368], d: [164, 436],
  e: [164, 164], f: [232, 232], g: [368, 368], h: [436, 436],
});
export const BOARD_POSITIONS = Object.keys(POINTS).map(id => /^\d+$/.test(id) ? Number(id) : id);
export const isBoardPosition = position => BOARD_POSITIONS.includes(position);
export function positionLabel(position) {
  return ({ center: '중앙', 5: '오른쪽 위 모서리', 10: '왼쪽 위 모서리', 15: '왼쪽 아래 모서리',
    20: '출발 칸', a: '오른쪽 위 대각선 바깥 칸', b: '오른쪽 위 대각선 안쪽 칸',
    c: '왼쪽 아래 대각선 안쪽 칸', d: '왼쪽 아래 대각선 바깥 칸',
    e: '왼쪽 위 대각선 바깥 칸', f: '왼쪽 위 대각선 안쪽 칸',
    g: '오른쪽 아래 대각선 안쪽 칸', h: '오른쪽 아래 대각선 바깥 칸',
  })[position] || (position === null ? '대기석' : position === 'finished' ? '완주' : `${position}번 칸`);
}
