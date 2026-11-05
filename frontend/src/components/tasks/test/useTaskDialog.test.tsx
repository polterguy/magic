// @vitest-environment jsdom
/*
 * useTaskDialog: the task editor's fields, its unsaved-changes guard on close, and creating or
 * updating the task on save.
 */
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogContext } from '../../../lib/useDialog';
import { useTaskDialog } from '../hooks/useTaskDialog';

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

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function mount(task: api.Task, isNew: boolean) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const hook = renderHook(() => useTaskDialog({ task, isNew, onClose, onSaved }), { wrapper });
  return { onClose, onSaved, ...hook };
}

const existing = { id: 'nightly', description: 'Cleans up', hyperlambda: 'log.info:x' };
const fresh = { id: '', description: '', hyperlambda: 'log.info:new' };

describe('initial state', () => {
  it('starts from the task being edited', () => {
    const { result } = mount(existing, false);
    expect(result.current.id).toBe('nightly');
    expect(result.current.description).toBe('Cleans up');
    expect(result.current.code).toBe('log.info:x');
    expect(result.current.busy).toBe(false);
  });

  it('treats a task without description or code as empty', () => {
    const { result } = mount({ id: 'bare' }, false);
    expect(result.current.description).toBe('');
    expect(result.current.code).toBe('');
  });

  it('bumps the edit token on request', () => {
    const { result } = mount(existing, false);
    const before = result.current.codeEditId;
    act(() => result.current.bumpCodeEditId());
    expect(result.current.codeEditId).toBe(before + 1);
  });
});

describe('close', () => {
  it('closes straight away when nothing changed', async () => {
    const { result, onClose } = mount(existing, false);
    await act(() => result.current.close());
    expect(dialog.confirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('asks before discarding edits and stays open when declined', async () => {
    dialog.confirm.mockResolvedValue(false);
    const { result, onClose } = mount(existing, false);
    act(() => result.current.setCode('changed'));
    await act(() => result.current.close());
    expect(dialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Discard unsaved changes?',
        message: 'nightly has unsaved changes.',
        danger: true,
      }),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes after the discard is confirmed', async () => {
    dialog.confirm.mockResolvedValue(true);
    const { result, onClose } = mount(existing, false);
    act(() => result.current.setDescription('changed'));
    await act(() => result.current.close());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('counts a new task as dirty once it has a name, and names it generically before that', async () => {
    dialog.confirm.mockResolvedValue(false);
    const { result } = mount(fresh, true);
    await act(() => result.current.close());
    expect(dialog.confirm).not.toHaveBeenCalled();
    act(() => result.current.setCode('edited'));
    await act(() => result.current.close());
    expect(dialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'This task has unsaved changes.' }),
    );
  });
});

describe('save', () => {
  it('insists a new task has a name', async () => {
    const { result, onSaved } = mount(fresh, true);
    await act(() => result.current.save());
    expect(toasts[0]).toMatchObject({ text: 'Give the task a name', isError: true });
    expect(api.createTask).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('creates a new task and reports it as new', async () => {
    const { result, onSaved } = mount(fresh, true);
    act(() => {
      result.current.setId('report');
      result.current.setDescription('Monthly report');
      result.current.setCode('log.info:report');
    });
    await act(() => result.current.save());
    expect(api.createTask).toHaveBeenCalledWith('report', 'Monthly report', 'log.info:report');
    expect(api.updateTask).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledWith('report', true);
    expect(result.current.busy).toBe(false);
  });

  it('updates an existing task and then no longer counts as dirty', async () => {
    const { result, onClose, onSaved } = mount(existing, false);
    act(() => result.current.setCode('log.info:v2'));
    await act(() => result.current.save());
    expect(api.updateTask).toHaveBeenCalledWith('nightly', 'Cleans up', 'log.info:v2');
    expect(api.createTask).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledWith('nightly', false);
    await act(() => result.current.close());
    expect(dialog.confirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('reports a failed save, stays dirty and releases busy', async () => {
    vi.mocked(api.updateTask).mockRejectedValue(new Error('invalid hyperlambda'));
    dialog.confirm.mockResolvedValue(false);
    const { result, onSaved } = mount(existing, false);
    act(() => result.current.setCode('broken'));
    await act(() => result.current.save());
    expect(toasts[0]).toMatchObject({ text: 'invalid hyperlambda', isError: true });
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.busy).toBe(false);
    await act(() => result.current.close());
    expect(dialog.confirm).toHaveBeenCalled();
  });
});
