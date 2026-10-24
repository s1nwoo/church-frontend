import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import AllSermonsPage from './AllSermonsPage';
import WorshipMediaPage from './WorshipMediaPage';

jest.mock('axios', () => ({ get: jest.fn() }));

const sunday = { id: 1, content: '주일 말씀', worshipType: 'SUNDAY', preacher: '목사님',
  sermonDate: '2026-10-18', youtubeUrl: 'https://youtu.be/sunday00001' };
const afternoon = { ...sunday, id: 2, content: '오후 말씀', worshipType: 'AFTERNOON' };

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderMedia(path = '/worship-media/all') {
  return render(<MemoryRouter initialEntries={[path]}>
    <Location />
    <Routes>
      <Route path="/worship-media/all" element={<AllSermonsPage />} />
      <Route path="/worship-media/:id" element={<WorshipMediaPage />} />
    </Routes>
  </MemoryRouter>);
}

beforeEach(() => {
  jest.clearAllMocks();
  axios.get.mockImplementation((url, config) => {
    if (url === '/api/sermons/2') return Promise.resolve({ data: afternoon });
    return Promise.resolve({ data: { content: config.params.worshipType === 'AFTERNOON' ? [afternoon] : [sunday] } });
  });
});

test('tabs are ordered and query each worship type separately', async () => {
  renderMedia();
  expect(await screen.findByText('주일 말씀')).toBeInTheDocument();
  expect(screen.getAllByRole('button').map(button => button.textContent))
    .toEqual(['주일예배', '오후예배', '공동체영상']);
  fireEvent.click(screen.getByRole('button', { name: '오후예배' }));
  expect(await screen.findByText('오후 말씀')).toBeInTheDocument();
  expect(screen.queryByText('주일 말씀')).not.toBeInTheDocument();
  expect(axios.get).toHaveBeenLastCalledWith('/api/sermons', expect.objectContaining({
    params: expect.objectContaining({ worshipType: 'AFTERNOON', includeDeleted: false }),
  }));
  expect(screen.getByTestId('location')).toHaveTextContent('?tab=afternoon');
});

test('direct afternoon link has a useful empty state and keeps all tabs available', async () => {
  axios.get.mockResolvedValue({ data: { content: [] } });
  renderMedia('/worship-media/all?tab=afternoon');
  expect(await screen.findByText('아직 등록된 오후예배 영상이 없습니다.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '오후예배' })).toHaveAttribute('aria-current', 'page');
});

test('afternoon detail retains its category when returning to the list', async () => {
  renderMedia('/worship-media/2');
  expect(await screen.findByTitle('오후 말씀')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '오후예배' })).toHaveAttribute('aria-current', 'page');
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/sermons', expect.objectContaining({
    params: expect.objectContaining({ worshipType: 'AFTERNOON' }),
  })));
  expect(screen.queryByText('주일 말씀')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '전체목록' }));
  expect(await screen.findByText('오후 말씀')).toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/worship-media/all?tab=afternoon');
});

test('late responses from the previous tab do not replace the current list', async () => {
  let resolveSunday;
  axios.get.mockImplementation((url, config) => config.params.worshipType === 'SUNDAY'
    ? new Promise(resolve => { resolveSunday = resolve; })
    : Promise.resolve({ data: { content: [afternoon] } }));
  renderMedia();
  fireEvent.click(screen.getByRole('button', { name: '오후예배' }));
  expect(await screen.findByText('오후 말씀')).toBeInTheDocument();
  await act(async () => resolveSunday({ data: { content: [sunday] } }));
  expect(screen.queryByText('주일 말씀')).not.toBeInTheDocument();
  expect(screen.getByText('오후 말씀')).toBeInTheDocument();
});

test('community tab remains accessible without requesting sermons', async () => {
  renderMedia('/worship-media/all?tab=community');
  expect(screen.getByText('공동체영상 콘텐츠는 준비중입니다.')).toBeInTheDocument();
  expect(axios.get).not.toHaveBeenCalled();
});

test('failed list request shows an error instead of an empty-category message', async () => {
  axios.get.mockRejectedValue(new Error('network'));
  renderMedia('/worship-media/all?tab=afternoon');
  expect(await screen.findByRole('alert')).toHaveTextContent('영상 목록을 불러오지 못했습니다.');
  expect(screen.queryByText('아직 등록된 오후예배 영상이 없습니다.')).not.toBeInTheDocument();
});
