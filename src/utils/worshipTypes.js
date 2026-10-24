export const WORSHIP_TYPES = [
  { value: 'SUNDAY', label: '주일예배', tab: 'sunday' },
  { value: 'AFTERNOON', label: '오후예배', tab: 'afternoon' },
];

export const WORSHIP_TABS = [
  ...WORSHIP_TYPES.map(({ tab, label }) => ({ key: tab, label })),
  { key: 'community', label: '공동체영상' },
];

export const worshipTypeForTab = tab => tab === 'afternoon' ? 'AFTERNOON' : 'SUNDAY';
export const tabForWorshipType = type => type === 'AFTERNOON' ? 'afternoon' : 'sunday';
export const worshipTypeLabel = type => type === 'AFTERNOON' ? '오후예배' : '주일예배';
