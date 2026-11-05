// @vitest-environment jsdom
/*
 * useAiFunctions: a single .hl file, or every .hl file inside a folder, is declared as an AI
 * function on the chosen model, one at a time.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { useAiFunctions } from '../hooks/useAiFunctions';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.getFileDescription).mockImplementation(path => Promise.resolve('about ' + path));
  vi.mocked(api.mlSnippetCreate).mockResolvedValue({} as never);
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

describe('useAiFunctions', () => {
  it('declares a single file without listing anything', async () => {
    const setWaiting = vi.fn();
    const { result } = renderHook(() => useAiFunctions(false, setWaiting));
    act(() => result.current.setAiFunctionTarget('/modules/a/hello.get.hl'));
    expect(result.current.aiFunctionTarget).toBe('/modules/a/hello.get.hl');

    await act(() => result.current.createAiFunctions('/modules/a/hello.get.hl', 'default'));

    expect(api.listFilesRecursively).not.toHaveBeenCalled();
    expect(api.mlSnippetCreate).toHaveBeenCalledWith({
      prompt: 'hello.get',
      completion: 'about /modules/a/hello.get.hl',
      type: 'default',
      meta: 'FUNCTION_INVOCATION ==> /modules/a/hello.get.hl',
    });
    expect(result.current.aiFunctionTarget).toBeNull();
    expect(toasts[0]).toMatchObject({
      text: '1 AI function(s) declared on default',
      isError: false,
    });
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('declares only the .hl files of a folder, honouring the system-files toggle', async () => {
    vi.mocked(api.listFilesRecursively).mockResolvedValue([
      '/modules/a/one.get.hl',
      '/modules/a/readme.md',
      '/modules/a/two.post.hl',
    ]);
    const { result } = renderHook(() => useAiFunctions(true, vi.fn()));

    await act(() => result.current.createAiFunctions('/modules/a/', 'support'));

    expect(api.listFilesRecursively).toHaveBeenCalledWith('/modules/a/', true);
    expect(vi.mocked(api.mlSnippetCreate).mock.calls.map(call => call[0].meta)).toEqual([
      'FUNCTION_INVOCATION ==> /modules/a/one.get.hl',
      'FUNCTION_INVOCATION ==> /modules/a/two.post.hl',
    ]);
    expect(toasts[0].text).toBe('2 AI function(s) declared on support');
  });

  it('declares nothing for a folder the server returns nothing for', async () => {
    vi.mocked(api.listFilesRecursively).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useAiFunctions(false, vi.fn()));
    await act(() => result.current.createAiFunctions('/empty/', 'default'));
    expect(api.mlSnippetCreate).not.toHaveBeenCalled();
    expect(toasts[0].text).toBe('0 AI function(s) declared on default');
  });

  it('stops at the first failure, reports it and releases the waiter', async () => {
    vi.mocked(api.listFilesRecursively).mockResolvedValue(['/a.hl', '/b.hl']);
    vi.mocked(api.mlSnippetCreate).mockRejectedValueOnce(new Error('model is full'));
    const setWaiting = vi.fn();
    const { result } = renderHook(() => useAiFunctions(false, setWaiting));

    await act(() => result.current.createAiFunctions('/', 'default'));

    expect(api.mlSnippetCreate).toHaveBeenCalledTimes(1);
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ text: 'model is full', isError: true });
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});
