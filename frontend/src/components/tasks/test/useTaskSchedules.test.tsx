// @vitest-environment jsdom
/*
 * useTaskSchedules: adding a schedule to the task being scheduled, and removing one behind a
 * confirmation.
 */
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogContext } from '../../../lib/useDialog';
import type { PagedList } from '../../../lib/usePagedList';
import { useTaskSchedules } from '../hooks/useTaskSchedules';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];
const dialog = {
  confirm: vi.fn<() => Promise<boolean>>(),
  confirmTyped: vi.fn(),
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
  const hook = renderHook(() => useTaskSchedules(list, setWaiting), { wrapper });
  return { list, setWaiting, ...hook };
}

describe('removeSchedule', () => {
  const schedule = { id: 7, due: '2030-01-01T00:00:00Z', repeats: '5.minutes' };

  it('names the task and its repetition in the confirmation', async () => {
    dialog.confirm.mockResolvedValue(false);
    const { result } = mount();
    await act(() => result.current.removeSchedule(task, schedule));
    expect(dialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Remove schedule?',
        message: 'nightly will no longer run every 5.minutes.',
        danger: true,
      }),
    );
  });

  it('deletes nothing when declined', async () => {
    dialog.confirm.mockResolvedValue(false);
    const { result, list } = mount();
    await act(() => result.current.removeSchedule(task, schedule));
    expect(api.deleteSchedule).not.toHaveBeenCalled();
    expect(list.refresh).not.toHaveBeenCalled();
  });

  it('deletes the schedule and refreshes the list when confirmed', async () => {
    dialog.confirm.mockResolvedValue(true);
    const { result, list, setWaiting } = mount();
    await act(() => result.current.removeSchedule(task, schedule));
    expect(api.deleteSchedule).toHaveBeenCalledWith(7);
    expect(list.refresh).toHaveBeenCalledTimes(1);
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('reports a failed delete without refreshing', async () => {
    dialog.confirm.mockResolvedValue(true);
    vi.mocked(api.deleteSchedule).mockRejectedValue(new Error('gone'));
    const { result, list, setWaiting } = mount();
    await act(() => result.current.removeSchedule(task, schedule));
    expect(toasts[0]).toMatchObject({ text: 'gone', isError: true });
    expect(list.refresh).not.toHaveBeenCalled();
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});

describe('addSchedule', () => {
  it('does nothing when no task is being scheduled', async () => {
    const { result } = mount();
    await act(() => result.current.addSchedule('2030-01-01', undefined));
    expect(api.scheduleTask).not.toHaveBeenCalled();
  });

  it('schedules the chosen task, closes the dialog and refreshes', async () => {
    const { result, list } = mount();
    act(() => result.current.setScheduling(task));
    expect(result.current.scheduling).toBe(task);
    await act(() => result.current.addSchedule(undefined, '10.minutes'));
    expect(api.scheduleTask).toHaveBeenCalledWith('nightly', undefined, '10.minutes');
    expect(result.current.scheduling).toBeNull();
    expect(toasts[0]).toMatchObject({ text: 'Schedule added to nightly', isError: false });
    expect(list.refresh).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open when scheduling fails', async () => {
    vi.mocked(api.scheduleTask).mockRejectedValue(new Error('bad pattern'));
    const { result, list, setWaiting } = mount();
    act(() => result.current.setScheduling(task));
    await act(() => result.current.addSchedule('2030-01-01T00:00:00Z', undefined));
    expect(result.current.scheduling).toBe(task);
    expect(toasts[0]).toMatchObject({ text: 'bad pattern', isError: true });
    expect(list.refresh).not.toHaveBeenCalled();
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});
