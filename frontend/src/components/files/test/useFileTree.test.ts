// @vitest-environment jsdom
/*
 * useFileTree and its companions: the tree state seeded from the remembered workspace, loading
 * the tree from the backend, toggling folders, and the path-based filter.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { useFileTree, useTreeFilter, useTreeLoad } from '../hooks/useFileTree';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];

beforeEach(() => {
  localStorage.clear();
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

describe('useFileTree', () => {
  it('starts from the remembered workspace', () => {
    const { result } = renderHook(() =>
      useFileTree({ sys: true, expanded: ['/etc/', '/modules/'] }),
    );
    expect(result.current.systemFiles).toBe(true);
    expect(result.current.expanded).toEqual(new Set(['/etc/', '/modules/']));
    expect(result.current.filter).toBe('');
  });

  it('starts empty and with the default width for a fresh workspace', () => {
    const { result } = renderHook(() => useFileTree({}));
    expect(result.current.systemFiles).toBe(false);
    expect(result.current.expanded.size).toBe(0);
    expect(result.current.treeWidth).toBe(340);
  });

  it('restores and persists the tree width', () => {
    localStorage.setItem('magic2.treeWidth', '500');
    const { result } = renderHook(() => useFileTree({}));
    expect(result.current.treeWidth).toBe(500);
    act(() => result.current.setTreeWidth(420));
    expect(localStorage.getItem('magic2.treeWidth')).toBe('420');
  });

  it('toggles folders open and closed', () => {
    const { result } = renderHook(() => useFileTree({ expanded: ['/a/'] }));
    act(() => result.current.toggle('/b/'));
    expect(result.current.expanded).toEqual(new Set(['/a/', '/b/']));
    act(() => result.current.toggle('/a/'));
    expect(result.current.expanded).toEqual(new Set(['/b/']));
  });

  it('loads folders and files recursively for the given system toggle', async () => {
    vi.mocked(api.listFoldersRecursively).mockResolvedValue(['/etc/']);
    vi.mocked(api.listFilesRecursively).mockResolvedValue(['/etc/a.txt']);
    const { result } = renderHook(() => useFileTree({}));

    await act(() => result.current.loadTree(true));

    expect(api.listFoldersRecursively).toHaveBeenCalledWith('/', true);
    expect(api.listFilesRecursively).toHaveBeenCalledWith('/', true);
    expect(result.current.folders).toEqual(['/etc/']);
    expect(result.current.files).toEqual(['/etc/a.txt']);
  });

  it('falls back to empty lists when the server answers nothing', async () => {
    vi.mocked(api.listFoldersRecursively).mockResolvedValue(undefined as never);
    vi.mocked(api.listFilesRecursively).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useFileTree({}));
    act(() => result.current.setFiles(['/old.txt']));
    await act(() => result.current.loadTree(false));
    expect(result.current.files).toEqual([]);
    expect(result.current.folders).toEqual([]);
  });

  it('reports a load failure and keeps the previous tree', async () => {
    vi.mocked(api.listFoldersRecursively).mockRejectedValue(new Error('offline'));
    vi.mocked(api.listFilesRecursively).mockResolvedValue([]);
    const { result } = renderHook(() => useFileTree({}));
    act(() => result.current.setFiles(['/keep.txt']));
    await act(() => result.current.loadTree(false));
    expect(result.current.files).toEqual(['/keep.txt']);
    expect(toasts[0]).toMatchObject({ text: 'offline', isError: true });
  });
});

describe('useTreeLoad', () => {
  it('loads the tree on mount and again when the toggle changes', async () => {
    vi.mocked(api.listFoldersRecursively).mockResolvedValue(['/f/']);
    vi.mocked(api.listFilesRecursively).mockResolvedValue(['/f/a']);
    const setFolders = vi.fn();
    const setFiles = vi.fn();
    const { rerender } = renderHook(({ sys }) => useTreeLoad(sys, setFolders, setFiles), {
      initialProps: { sys: false },
    });
    await waitFor(() => expect(setFiles).toHaveBeenCalledWith(['/f/a']));
    expect(setFolders).toHaveBeenCalledWith(['/f/']);
    expect(api.listFoldersRecursively).toHaveBeenLastCalledWith('/', false);

    rerender({ sys: true });
    await waitFor(() => expect(api.listFoldersRecursively).toHaveBeenLastCalledWith('/', true));
  });

  it('reports a failed load', async () => {
    vi.mocked(api.listFoldersRecursively).mockRejectedValue(new Error('denied'));
    vi.mocked(api.listFilesRecursively).mockResolvedValue([]);
    renderHook(() => useTreeLoad(false, vi.fn(), vi.fn()));
    await waitFor(() => expect(toasts).toHaveLength(1));
    expect(toasts[0].text).toBe('denied');
  });

  it('uses empty lists for empty answers', async () => {
    vi.mocked(api.listFoldersRecursively).mockResolvedValue(undefined as never);
    vi.mocked(api.listFilesRecursively).mockResolvedValue(undefined as never);
    const setFolders = vi.fn();
    const setFiles = vi.fn();
    renderHook(() => useTreeLoad(false, setFolders, setFiles));
    await waitFor(() => expect(setFolders).toHaveBeenCalledWith([]));
    expect(setFiles).toHaveBeenCalledWith([]);
  });
});

describe('useTreeFilter', () => {
  const folders = ['/etc/', '/etc/www/', '/modules/', '/modules/app/'];
  const files = ['/etc/www/index.html', '/modules/app/Main.hl', '/readme.md'];

  it('shows everything and no folder restriction without a filter', () => {
    const { result } = renderHook(() => useTreeFilter('', folders, files));
    expect(result.current.query).toBe('');
    expect(result.current.visibleFiles).toBe(files);
    expect(result.current.visibleFolders).toBeNull();
  });

  it('matches on the full path, case-insensitively, and keeps the ancestors visible', async () => {
    const { result } = renderHook(() => useTreeFilter('  MAIN ', folders, files));
    await waitFor(() => expect(result.current.query).toBe('main'));
    expect(result.current.visibleFiles).toEqual(['/modules/app/Main.hl']);
    expect(result.current.visibleFolders).toEqual(new Set(['/modules/', '/modules/app/']));
  });

  it('brings up everything inside a folder whose name matches', async () => {
    const { result } = renderHook(() => useTreeFilter('www', folders, files));
    await waitFor(() => expect(result.current.query).toBe('www'));
    expect(result.current.visibleFiles).toEqual(['/etc/www/index.html']);
    expect(result.current.visibleFolders).toEqual(new Set(['/etc/', '/etc/www/']));
  });

  it('shows a matching top-level file without any folders', async () => {
    const { result } = renderHook(() => useTreeFilter('readme', folders, files));
    await waitFor(() => expect(result.current.query).toBe('readme'));
    expect(result.current.visibleFiles).toEqual(['/readme.md']);
    expect(result.current.visibleFolders?.size).toBe(0);
  });
});
