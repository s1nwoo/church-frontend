import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import PostManagePage from './PostManagePage';

jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));
const document = { id: 7, title: '주일 예배자료', writer: '관리자', category: '공지사항', content: '', adminOnly: true,
  attachments: [{ id: 11, filename: '주일.pptx', size: 4 }] };
function page() { render(<MemoryRouter><PostManagePage /></MemoryRouter>); }
function blobText(blob) { return new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(blob); }); }
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear(); localStorage.setItem('accessToken', 'admin-token');
  axios.get.mockResolvedValue({ data: { content: [document], totalPages: 1 } });
  axios.post.mockResolvedValue({ data: {} }); axios.put.mockResolvedValue({ data: {} }); axios.delete.mockResolvedValue({});
  jest.spyOn(window, 'confirm').mockReturnValue(true); jest.spyOn(window, 'alert').mockImplementation(() => {});
  URL.createObjectURL = jest.fn(() => 'blob:attachment'); URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test('loads private posts through the authenticated admin list and supports the visibility filter', async () => {
  page(); await screen.findByText('주일 예배자료');
  expect(axios.get).toHaveBeenCalledWith('/api/admin/posts', expect.objectContaining({ headers: { Authorization: 'Bearer admin-token' } }));
  fireEvent.change(screen.getByLabelText('공개 범위 필터'), { target: { value: 'true' } });
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/admin/posts', expect.objectContaining({ params: expect.objectContaining({ adminOnly: true }) })));
});
test('the materials shortcut defaults to private and sends files only with the final save', async () => {
  page(); await screen.findByText('주일 예배자료'); fireEvent.click(screen.getByRole('button', { name: '관리자 자료 올리기' }));
  expect(screen.getByLabelText('공개 범위')).toHaveValue('true');
  fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '개인 자료' } });
  fireEvent.change(screen.getByLabelText(/첨부파일 \(/), { target: { files: [new File(['ppt'], '자료.pptx')] } });
  expect(axios.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(axios.post).toHaveBeenCalled());
  const [url, payload, config] = axios.post.mock.calls[0];
  expect(url).toBe('/api/admin/posts'); expect(config.headers.Authorization).toBe('Bearer admin-token');
  expect(JSON.parse(await blobText(payload.get('post')))).toEqual(expect.objectContaining({ adminOnly: true, title: '개인 자료' }));
  expect(payload.getAll('files')[0].name).toBe('자료.pptx');
});
test('cancelled registration never uploads selected files', async () => {
  page(); await screen.findByText('주일 예배자료'); fireEvent.click(screen.getByRole('button', { name: '관리자 자료 올리기' }));
  fireEvent.change(screen.getByLabelText(/첨부파일 \(/), { target: { files: [new File(['ppt'], '자료.pptx')] } });
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(axios.post).not.toHaveBeenCalled();
});
test('existing attachments are removed only when edits are saved', async () => {
  page(); await screen.findByText('주일 예배자료'); fireEvent.click(screen.getByRole('button', { name: '수정' }));
  fireEvent.click(screen.getByLabelText('주일.pptx 삭제 (저장 시 실제 파일 삭제)'));
  expect(axios.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(axios.put).toHaveBeenCalled());
  const [url, payload] = axios.put.mock.calls[0]; expect(url).toBe('/api/admin/posts/7');
  expect(JSON.parse(await blobText(payload.get('removeAttachmentIds')))).toEqual([11]);
});
test('downloads with the login token instead of exposing a public file URL', async () => {
  page(); await screen.findByText('주일 예배자료');
  axios.get.mockResolvedValueOnce({ data: new Blob(['ppt']) });
  fireEvent.click(screen.getByRole('button', { name: /주일.pptx.*다운로드/ }));
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/posts/7/attachments/11', {
    headers: { Authorization: 'Bearer admin-token' }, responseType: 'blob'
  }));
  await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled());
  expect(HTMLAnchorElement.prototype.click.mock.instances[0].download).toBe('주일.pptx');
});
test('deletion failure keeps the post and reports that deletion did not complete', async () => {
  page(); await screen.findByText('주일 예배자료');
  axios.delete.mockRejectedValueOnce({ response: { data: { message: '첨부파일 삭제 실패' } } });
  fireEvent.click(screen.getByRole('button', { name: '삭제', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('첨부파일 삭제 실패');
  expect(screen.getByText('주일 예배자료')).toBeInTheDocument();
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('모든 첨부파일'));
});
