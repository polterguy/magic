// @vitest-environment jsdom
/*
 * useTaskActions: executing and deleting tasks from the list, each confirmed first (deleting
 * by typing the task name back).
 */
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogContext } from '../../../lib/useDialog';
import type { PagedList } from '../../../lib/usePagedList';
import { useTaskActions } from '../hooks/useTaskActions';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];
const dialog = {
  confirm: vi.fn<() => Promise<boolean>>(),
  confirmTyped: vi.fn<() => Promise<boolean>>(),
  prompt: vi.fn(),
  form: vi.fn(),
  choice: vi.fn(),
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>
);
const task = { id: 'nightly' } as api.Task;

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function mount() {
  const list = { refresh: vi.fn() } as unknown as PagedList<api.Task>;
  const setWaiting = vi.fn();
  const hook = renderHook(() => useTaskActions(list, setWaiting), { wrapper });
  return { list, setWaiting, ...hook };
}

describe('execute', () => {
  it('does not run the task when declined', async () => {
    dialog.confirm.mockResolvedValue(false);
    const { result } = mount();
    await act(() => result.current.execute(task));
    expect(dialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Execute task?',
        message: 'nightly will run on your server right now.',
      }),
    );
    expect(api.executeTask).not.toHaveBeenCalled();
  });

  it('runs the task and says so when confirmed', async () => {
    dialog.confirm.mockResolvedValue(true);
    const { result, setWaiting } = mount();
    await act(() => result.current.execute(task));
    expect(api.executeTask).toHaveBeenCalledWith('nightly');
    expect(toasts[0]).toMatchObject({ text: 'Task nightly executed', isError: false });
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('reports a failed run and releases the waiter', async () => {
    dialog.confirm.mockResolvedValue(true);
    vi.mocked(api.executeTask).mockRejectedValue(new Error('task threw'));
    const { result, setWaiting } = mount();
    await act(() => result.current.execute(task));
    expect(toasts[0]).toMatchObject({ text: 'task threw', isError: true });
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});

describe('remove', () => {
  it('requires the task name to be typed back', async () => {
    dialog.confirmTyped.mockResolvedValue(false);
    const { result, list } = mount();
    await act(() => result.current.remove(task));
    expect(dialog.confirmTyped).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Delete task?', expected: 'nightly', label: 'Task name' }),
    );
    expect(api.deleteTask).not.toHaveBeenCalled();
    expect(list.refresh).not.toHaveBeenCalled();
  });

  it('deletes the task, announces it and refreshes the list', async () => {
    dialog.confirmTyped.mockResolvedValue(true);
    const { result, list } = mount();
    await act(() => result.current.remove(task));
    expect(api.deleteTask).toHaveBeenCalledWith('nightly');
    expect(toasts[0]).toMatchObject({ text: 'Task nightly deleted', isError: false });
    expect(list.refresh).toHaveBeenCalledTimes(1);
  });

  it('reports a failed delete without refreshing', async () => {
    dialog.confirmTyped.mockResolvedValue(true);
    vi.mocked(api.deleteTask).mockRejectedValue(new Error('still scheduled'));
    const { result, list, setWaiting } = mount();
    await act(() => result.current.remove(task));
    expect(toasts[0]).toMatchObject({ text: 'still scheduled', isError: true });
    expect(list.refresh).not.toHaveBeenCalled();
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});
