import { describe, expect, it, vi } from 'vitest';
import { notifyChatOpsDone, onChatOpsDone } from '../chatOps';

describe('chatOps', () => {
  it('notifies every subscribed listener', () => {
    const first = vi.fn();
    const second = vi.fn();
    const offFirst = onChatOpsDone(first);
    const offSecond = onChatOpsDone(second);
    notifyChatOpsDone();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    offFirst();
    offSecond();
  });

  it('stops notifying a listener once it unsubscribes', () => {
    const listener = vi.fn();
    const off = onChatOpsDone(listener);
    off();
    notifyChatOpsDone();
    expect(listener).not.toHaveBeenCalled();
  });

  it('subscribes the same function only once', () => {
    const listener = vi.fn();
    const off = onChatOpsDone(listener);
    onChatOpsDone(listener);
    notifyChatOpsDone();
    expect(listener).toHaveBeenCalledTimes(1);
    off();
  });

  it('is a no-op with nobody listening', () => {
    expect(() => notifyChatOpsDone()).not.toThrow();
  });
});
