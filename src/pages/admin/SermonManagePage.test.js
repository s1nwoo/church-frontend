import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import SermonManagePage from './SermonManagePage';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  axios.get.mockResolvedValue({ data: { content: [], totalPages: 0, totalElements: 0, number: 0 } });
  axios.post.mockResolvedValue({ data: {} });
  axios.put.mockResolvedValue({ data: {} });
});

test('new afternoon sermon submits a string category and preserves boolean deleted flag', async () => {
  render(<SermonManagePage />);
  await waitFor(() => expect(axios.get).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: '등록' }));
  fireEvent.change(screen.getByLabelText(/예배 구분\*/), { target: { value: 'AFTERNOON' } });
  fireEvent.change(screen.getByLabelText(/말씀 제목/), { target: { value: '오후 설교' } });
  fireEvent.change(screen.getByLabelText(/설교 날짜/), { target: { value: '2026-10-18' } });
  fireEvent.change(screen.getByLabelText(/유튜브 링크/), { target: { value: 'https://youtu.be/test0000001' } });
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/sermons', expect.objectContaining({
    worshipType: 'AFTERNOON', deleted: false, content: '오후 설교',
  })));
});

test('existing sermon can be reclassified and the saved category is visible in its edit form', async () => {
  axios.get.mockResolvedValue({ data: { content: [{ id: 7, content: '기존 말씀', worshipType: 'AFTERNOON',
    preacher: '김성휘 목사님', sermonDate: '2026-10-18', youtubeUrl: 'https://youtu.be/test0000001', deleted: false }] } });
  render(<SermonManagePage />);
  fireEvent.click(await screen.findByRole('button', { name: '수정' }));
  expect(screen.getByLabelText(/예배 구분\*/)).toHaveValue('AFTERNOON');
  fireEvent.change(screen.getByLabelText(/예배 구분\*/), { target: { value: 'SUNDAY' } });
  fireEvent.change(screen.getByLabelText('삭제 여부'), { target: { value: 'true' } });
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/api/sermons/7', expect.objectContaining({
    worshipType: 'SUNDAY', deleted: true,
  })));
});

test('category filter requests the first page of the selected worship type', async () => {
  render(<SermonManagePage />);
  fireEvent.change(screen.getByRole('combobox', { name: '예배 구분 필터' }), { target: { value: 'AFTERNOON' } });
  await waitFor(() => expect(axios.get).toHaveBeenLastCalledWith('/api/sermons', expect.objectContaining({
    params: expect.objectContaining({ worshipType: 'AFTERNOON', page: 0, includeDeleted: true }),
  })));
});
