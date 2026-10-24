export const WORSHIP_TYPES = [
  { value: 'SUNDAY', label: '주일예배', tab: 'sunday' },
  { value: 'AFTERNOON', label: '오후예배', tab: 'afternoon' },
  { value: 'COMMUNITY', label: '공동체영상', tab: 'community' },
];

export const WORSHIP_TABS = [
  ...WORSHIP_TYPES.map(({ tab, label }) => ({ key: tab, label })),
];

export const worshipTypeForTab = tab => WORSHIP_TYPES.find(type => type.tab === tab)?.value || 'SUNDAY';
export const tabForWorshipType = type => WORSHIP_TYPES.find(option => option.value === type)?.tab || 'sunday';
export const worshipTypeLabel = type => WORSHIP_TYPES.find(option => option.value === type)?.label || '주일예배';
