// @vitest-environment jsdom
/*
 * useTaskEditor: opening an existing task (fetching its Hyperlambda), opening a blank new one,
 * and the one-shot "?edit=" deep link that is consumed from the URL.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { SetURLSearchParams } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { NEW_TASK_CODE } from '../constants';
import { useTaskEditor } from '../hooks/useTaskEditor';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function mount(query = '') {
  const params = new URLSearchParams(query);
  const setParams = vi.fn() as unknown as SetURLSearchParams;
  const setWaiting = vi.fn();
  const hook = renderHook(() => useTaskEditor(params, setParams, setWaiting));
  return { params, setParams, setWaiting, ...hook };
}

describe('openEdit', () => {
  it('fetches the full task and opens it as an existing task', async () => {
    const full = { id: 'nightly', description: 'd', hyperlambda: 'log.info:x' };
    vi.mocked(api.getTask).mockResolvedValue(full);
    const { result, setWaiting } = mount();
    await act(() => result.current.openEdit('nightly'));
    expect(api.getTask).toHaveBeenCalledWith('nightly');
    expect(result.current.editing).toEqual({ task: full, isNew: false });
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('reports a failed fetch and opens nothing', async () => {
    vi.mocked(api.getTask).mockRejectedValue(new Error('no such task'));
    const { result, setWaiting } = mount();
    await act(() => result.current.openEdit('ghost'));
    expect(result.current.editing).toBeNull();
    expect(toasts[0]).toMatchObject({ text: 'no such task', isError: true });
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});

describe('openNew and setEditing', () => {
  it('opens a blank task seeded with the template code', () => {
    const { result } = mount();
    act(() => result.current.openNew());
    expect(result.current.editing).toEqual({
      task: { id: '', description: '', hyperlambda: NEW_TASK_CODE },
      isNew: true,
    });
  });

  it('closes the editor when editing is cleared', () => {
    const { result } = mount();
    act(() => result.current.openNew());
    act(() => result.current.setEditing(null));
    expect(result.current.editing).toBeNull();
  });
});

describe('deep link', () => {
  it('does nothing without an edit parameter', () => {
    const { setParams } = mount('other=1');
    expect(api.getTask).not.toHaveBeenCalled();
    expect(setParams).not.toHaveBeenCalled();
  });

  it('opens the linked task once and drops the parameter from the URL', async () => {
    vi.mocked(api.getTask).mockResolvedValue({ id: 'nightly' });
    const { result, params, setParams } = mount('edit=nightly&keep=1');
    await waitFor(() => expect(result.current.editing?.task.id).toBe('nightly'));
    expect(api.getTask).toHaveBeenCalledTimes(1);
    expect(params.has('edit')).toBe(false);
    expect(setParams).toHaveBeenCalledWith(params, { replace: true });
    expect(params.get('keep')).toBe('1');
  });
});
