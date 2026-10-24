import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import AllSermonsPage from './AllSermonsPage';
import WorshipMediaPage from './WorshipMediaPage';

jest.mock('axios', () => ({ get: jest.fn() }));

const sunday = { id: 1, content: '주일 말씀', worshipType: 'SUNDAY', preacher: '목사님',
  sermonDate: '2026-10-18', youtubeUrl: 'https://youtu.be/sunday00001', bibleText: '요3:16', bibleVerses: ['주일 성경구절'] };
const afternoon = { ...sunday, id: 2, content: '오후 말씀', worshipType: 'AFTERNOON' };
const community = { ...sunday, id: 3, content: '가을 공동체 행사', worshipType: 'COMMUNITY' };
const videos = [sunday, afternoon, community];

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}
function renderMedia(path = '/worship-media') {
  return render(<MemoryRouter initialEntries={[path]}>
    <Location />
    <Routes>
      <Route path="/worship-media" element={<WorshipMediaPage />} />
      <Route path="/worship-media/all" element={<AllSermonsPage />} />
      <Route path="/worship-media/:id" element={<WorshipMediaPage />} />
    </Routes>
  </MemoryRouter>);
}
function mockGet(url, config) {
  if (url === '/api/sermons') return Promise.resolve({ data: { content: videos.filter(video => video.worshipType === config.params.worshipType) } });
  return Promise.resolve({ data: videos.find(video => url === '/api/sermons/' + video.id) });
}
beforeEach(() => {
  jest.clearAllMocks();
  axios.get.mockImplementation(mockGet);
});

test('media entry opens latest Sunday video with sermon text instead of full list', async () => {
  const { container } = renderMedia();
  expect(await screen.findByTitle('주일 말씀')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /설교본문/ })).toBeInTheDocument();
  expect(screen.getByText('주일 성경구절')).toBeInTheDocument();
  expect(container.querySelector('.sermon-list')).not.toBeInTheDocument();
  expect(screen.getAllByRole('button').slice(0, 3).map(button => button.textContent))
    .toEqual(['주일예배', '오후예배', '공동체영상']);
  expect(axios.get).toHaveBeenCalledWith('/api/sermons', expect.objectContaining({
    params: expect.objectContaining({ size: 1, worshipType: 'SUNDAY', includeDeleted: false }),
  }));
});

test('afternoon tab opens its latest video from an existing Sunday detail', async () => {
  const { container } = renderMedia('/worship-media/1');
  await screen.findByTitle('주일 말씀');
  fireEvent.click(screen.getByRole('button', { name: '오후예배' }));
  expect(await screen.findByTitle('오후 말씀')).toBeInTheDocument();
  expect(screen.queryByTitle('주일 말씀')).not.toBeInTheDocument();
  expect(container.querySelector('.sermon-list')).not.toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/worship-media?tab=afternoon');
});

test('clicking a tab from the full list also opens the latest video', async () => {
  const { container } = renderMedia('/worship-media/all?tab=afternoon');
  await screen.findByText('오후 말씀');
  fireEvent.click(screen.getByRole('button', { name: '주일예배' }));
  expect(await screen.findByTitle('주일 말씀')).toBeInTheDocument();
  expect(container.querySelector('.sermon-list')).not.toBeInTheDocument();
});

test('full list button preserves the category and a list item opens its detail', async () => {
  const { container } = renderMedia('/worship-media?tab=afternoon');
  await screen.findByTitle('오후 말씀');
  fireEvent.click(screen.getByRole('button', { name: '전체목록' }));
  fireEvent.click(await screen.findByText('오후 말씀'));
  expect(await screen.findByTitle('오후 말씀')).toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/worship-media/2');
  fireEvent.click(screen.getByRole('button', { name: '전체목록' }));
  await screen.findByText('오후 말씀');
  expect(screen.getByTestId('location')).toHaveTextContent('/worship-media/all?tab=afternoon');
  expect(container.querySelector('.sermon-list')).toBeInTheDocument();
  expect(screen.queryByTitle('오후 말씀')).not.toBeInTheDocument();
});

test('empty latest category shows notice and keeps tabs available', async () => {
  axios.get.mockResolvedValue({ data: { content: [] } });
  renderMedia('/worship-media?tab=afternoon');
  expect(await screen.findByText('아직 등록된 오후예배 영상이 없습니다.')).toBeInTheDocument();
  expect(screen.queryByText('로딩 중…')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '오후예배' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('button', { name: '전체목록' })).toBeInTheDocument();
});

test('late latest-video response from previous tab cannot replace current video', async () => {
  let resolveSunday;
  axios.get.mockImplementation((url, config) => url === '/api/sermons/1'
    ? new Promise(resolve => { resolveSunday = resolve; }) : mockGet(url, config));
  renderMedia();
  await waitFor(() => expect(resolveSunday).toBeDefined());
  fireEvent.click(screen.getByRole('button', { name: '오후예배' }));
  await screen.findByTitle('오후 말씀');
  await act(async () => resolveSunday({ data: sunday }));
  expect(screen.queryByTitle('주일 말씀')).not.toBeInTheDocument();
  expect(screen.getByTitle('오후 말씀')).toBeInTheDocument();
});

test.each(['/worship-media?tab=community', '/worship-media/3'])('community video has no sermon section: %s', async path => {
  const { container } = renderMedia(path);
  expect(await screen.findByTitle('가을 공동체 행사')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '공동체영상' })).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByRole('heading', { name: /설교본문/ })).not.toBeInTheDocument();
  expect(screen.queryByText('주일 성경구절')).not.toBeInTheDocument();
  expect(screen.queryByText('성경구절 정보가 없습니다.')).not.toBeInTheDocument();
  expect(container.querySelector('.media-transcript')).not.toBeInTheDocument();
  expect(screen.queryByText(/목사님/)).not.toBeInTheDocument();
});

test('community full list only displays community videos and opens detail', async () => {
  renderMedia('/worship-media/all?tab=community');
  fireEvent.click(await screen.findByText('가을 공동체 행사'));
  expect(await screen.findByTitle('가을 공동체 행사')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /설교본문/ })).not.toBeInTheDocument();
});

test('failed latest request shows error instead of empty notice', async () => {
  axios.get.mockImplementation((url, config) => config?.params?.size === 1
    ? Promise.reject(new Error('network')) : mockGet(url, config));
  renderMedia('/worship-media?tab=afternoon');
  expect(await screen.findByRole('alert')).toHaveTextContent('영상을 불러오지 못했습니다.');
  expect(screen.queryByText('아직 등록된 오후예배 영상이 없습니다.')).not.toBeInTheDocument();
});
