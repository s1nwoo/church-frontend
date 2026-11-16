import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BibleProjectorPage from './BibleProjectorPage';

class FakeChannel {
  static all = [];
  constructor() { this.sent = []; FakeChannel.all.push(this); }
  postMessage(message) { this.sent.push(message); }
  close() {}
}
beforeEach(() => {
  FakeChannel.all = []; global.BroadcastChannel = FakeChannel;
  URL.createObjectURL = jest.fn(() => 'blob:slide'); URL.revokeObjectURL = jest.fn();
});
afterEach(() => { delete global.BroadcastChannel; });

test('announces itself, shows sent slides, blanks and forwards clicker keys', async () => {
  render(<BibleProjectorPage />);
  const channel = FakeChannel.all[0];
  expect(channel.sent).toContainEqual({ type: 'hello' });
  expect(screen.getByText(/더블클릭/)).toBeInTheDocument();
  await act(async () => channel.onmessage({ data: { type: 'show', image: new Blob(['png']) } }));
  const img = screen.getByAltText('송출 중인 말씀 슬라이드');
  expect(img).toHaveAttribute('src', 'blob:slide');
  await act(async () => channel.onmessage({ data: { type: 'black', on: true } }));
  expect(img).toHaveClass('is-hidden');
  fireEvent.keyDown(window, { key: 'PageDown' });
  expect(channel.sent).toContainEqual({ type: 'key', action: 'next' });
  await act(async () => channel.onmessage({ data: { type: 'ping' } }));
  expect(channel.sent.filter(m => m.type === 'hello')).toHaveLength(2);
});
