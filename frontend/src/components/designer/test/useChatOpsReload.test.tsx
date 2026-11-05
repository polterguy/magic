// @vitest-environment jsdom
/*
 * The wire between the Web Designer and Chat Ops: a finished turn reloads the open page and the
 * page list when nothing is unsaved, and only says so (marking the canvas stale) when there is.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { notifyChatOpsDone } from '../../../lib/chatOps';
import { setToastListener, type Toast } from '../../../lib/toast';
import { useChatOpsReload } from '../hooks/useChatOpsReload';

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
});

afterEach(() => {
  setToastListener(null);
});

function setup(
  props: { dirty?: boolean; path?: string; loadPages?: () => Promise<string[]> } = {},
) {
  const setStale = vi.fn();
  const openPage = vi.fn().mockResolvedValue(undefined);
  const loadPages = props.loadPages ?? vi.fn().mockResolvedValue(['/etc/www/index.html']);
  const rig = renderHook(
    (current: { dirty: boolean; path: string }) =>
      useChatOpsReload({ ...current, setStale, openPage, loadPages }),
    { initialProps: { dirty: props.dirty ?? false, path: props.path ?? '/etc/www/index.html' } },
  );
  return { setStale, openPage, loadPages, rig };
}

describe('useChatOpsReload', () => {
  it('reopens the page forcibly and refreshes the page list when nothing is unsaved', () => {
    const { openPage, loadPages, setStale } = setup();
    notifyChatOpsDone();
    expect(openPage).toHaveBeenCalledWith('/etc/www/index.html', true);
    expect(loadPages).toHaveBeenCalledTimes(1);
    expect(setStale).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(0);
  });

  it('waits and says so when there is unsaved work', () => {
    const { openPage, loadPages, setStale } = setup({ dirty: true });
    notifyChatOpsDone();
    expect(setStale).toHaveBeenCalledWith(true);
    expect(toasts).toEqual([
      expect.objectContaining({
        text: 'Chat Ops changed files on the server — reload when you are ready',
        isError: false,
      }),
    ]);
    expect(openPage).not.toHaveBeenCalled();
    expect(loadPages).not.toHaveBeenCalled();
  });

  it('only refreshes the page list when no page is open', () => {
    const { openPage, loadPages } = setup({ path: '' });
    notifyChatOpsDone();
    expect(openPage).not.toHaveBeenCalled();
    expect(loadPages).toHaveBeenCalledTimes(1);
  });

  it('uses the current dirty state, not the one at mount', () => {
    const { openPage, setStale, rig } = setup();
    rig.rerender({ dirty: true, path: '/etc/www/index.html' });
    notifyChatOpsDone();
    expect(setStale).toHaveBeenCalledWith(true);
    expect(openPage).not.toHaveBeenCalled();
  });

  it('swallows a failed page list refresh', async () => {
    const loadPages = vi.fn().mockRejectedValue(new Error('offline'));
    setup({ loadPages });
    notifyChatOpsDone();
    await Promise.resolve();
    expect(loadPages).toHaveBeenCalledTimes(1);
    expect(toasts).toHaveLength(0);
  });

  it('stops listening when unmounted', () => {
    const { openPage, rig } = setup();
    rig.unmount();
    notifyChatOpsDone();
    expect(openPage).not.toHaveBeenCalled();
  });
});
