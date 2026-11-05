// @vitest-environment jsdom
/*
 * useOpenTabs: tabs restored from the remembered workspace (dropping files that no longer load
 * and keeping anything opened meanwhile), the derived dirty state, tab cycling, content edits
 * and persistence of the workspace shape.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import type { Workspace } from '../helpers';
import { useOpenTabs } from '../hooks/useOpenTabs';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];
const KEY = 'ws-key';

beforeEach(() => {
  localStorage.clear();
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.loadFile).mockImplementation(path => Promise.resolve('text of ' + path));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function mount(workspace: Workspace = {}, expanded = new Set<string>(), sys = false) {
  return renderHook(() => useOpenTabs(workspace, KEY, expanded, sys));
}

const stored = () => JSON.parse(localStorage.getItem(KEY) ?? '{}') as Workspace;

describe('useOpenTabs restore', () => {
  it('opens nothing for a fresh workspace', () => {
    const { result } = mount();
    expect(result.current.openFiles).toEqual([]);
    expect(result.current.selectedFile).toBe('');
    expect(result.current.current).toBeNull();
    expect(result.current.content).toBe('');
    expect(result.current.dirty).toBe(false);
    expect(api.loadFile).not.toHaveBeenCalled();
  });

  it('reloads remembered files fresh and selects the remembered one', async () => {
    const { result } = mount({ open: ['/a.hl', '/b.hl'], selected: '/a.hl' });
    await waitFor(() => expect(result.current.openFiles).toHaveLength(2));
    expect(result.current.openFiles).toEqual([
      { path: '/a.hl', content: 'text of /a.hl', saved: 'text of /a.hl' },
      { path: '/b.hl', content: 'text of /b.hl', saved: 'text of /b.hl' },
    ]);
    expect(result.current.selectedFile).toBe('/a.hl');
    expect(result.current.content).toBe('text of /a.hl');
  });

  it('selects the last restored file when the remembered selection is gone', async () => {
    vi.mocked(api.loadFile).mockImplementation(path =>
      path === '/gone.hl' ? Promise.reject(new Error('404')) : Promise.resolve('x'),
    );
    const { result } = mount({ open: ['/a.hl', '/gone.hl', '/b.hl'], selected: '/gone.hl' });
    await waitFor(() => expect(result.current.openFiles).toHaveLength(2));
    expect(result.current.openFiles.map(file => file.path)).toEqual(['/a.hl', '/b.hl']);
    expect(result.current.selectedFile).toBe('/b.hl');
    expect(toasts).toHaveLength(0);
  });

  it('opens nothing when none of the remembered files load', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('404'));
    const { result } = mount({ open: ['/a.hl'], selected: '/a.hl' });
    await waitFor(() => expect(api.loadFile).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.openFiles).toEqual([]);
    expect(result.current.selectedFile).toBe('');
  });

  it('keeps a file opened while the restore was in flight, and its selection', async () => {
    let release: (text: string) => void = () => {
      // replaced below, once the load is in flight
    };
    vi.mocked(api.loadFile).mockImplementation(
      () =>
        new Promise<string>(resolve => {
          release = resolve;
        }),
    );
    const { result } = mount({ open: ['/old.hl'], selected: '/old.hl' });
    act(() => {
      result.current.setOpenFiles([{ path: '/new.hl', content: 'n', saved: 'n' }]);
      result.current.setSelectedFile('/new.hl');
    });
    await act(async () => {
      release('old text');
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.openFiles).toHaveLength(2));
    expect(result.current.openFiles.map(file => file.path)).toEqual(['/old.hl', '/new.hl']);
    expect(result.current.selectedFile).toBe('/new.hl');
  });
});

describe('useOpenTabs editing', () => {
  async function withTwoTabs() {
    const hook = mount({ open: ['/a.hl', '/b.hl', '/c.hl'], selected: '/a.hl' });
    await waitFor(() => expect(hook.result.current.openFiles).toHaveLength(3));
    return hook;
  }

  it('marks the selected file dirty once its content differs from what was saved', async () => {
    const { result } = await withTwoTabs();
    act(() => result.current.updateContent('changed'));
    expect(result.current.content).toBe('changed');
    expect(result.current.dirty).toBe(true);
    expect(result.current.dirtyFiles.map(file => file.path)).toEqual(['/a.hl']);
  });

  it('bumps the edit token on every content update', async () => {
    const { result } = await withTwoTabs();
    const before = result.current.contentEditId;
    act(() => result.current.updateContent('one'));
    act(() => result.current.updateContent('two'));
    expect(result.current.contentEditId).toBe(before + 2);
  });

  it('only changes the selected file', async () => {
    const { result } = await withTwoTabs();
    act(() => result.current.updateContent('changed'));
    expect(result.current.openFiles.map(file => file.content)).toEqual([
      'changed',
      'text of /b.hl',
      'text of /c.hl',
    ]);
  });

  it('cycles tabs forwards and backwards, wrapping at both ends', async () => {
    const { result } = await withTwoTabs();
    act(() => result.current.switchTab(1));
    expect(result.current.selectedFile).toBe('/b.hl');
    act(() => result.current.switchTab(-1));
    act(() => result.current.switchTab(-1));
    expect(result.current.selectedFile).toBe('/c.hl');
    act(() => result.current.switchTab(1));
    expect(result.current.selectedFile).toBe('/a.hl');
  });

  it('does not cycle with fewer than two tabs', () => {
    const { result } = mount();
    act(() => {
      result.current.setOpenFiles([{ path: '/only.hl', content: '', saved: '' }]);
      result.current.setSelectedFile('/only.hl');
    });
    act(() => result.current.switchTab(1));
    expect(result.current.selectedFile).toBe('/only.hl');
  });
});

describe('useOpenTabs persistence', () => {
  it('remembers paths, selection, expanded folders and the sys toggle but not contents', async () => {
    const { result } = mount({}, new Set(['/etc/']), true);
    act(() => {
      result.current.setOpenFiles([{ path: '/a.hl', content: 'secret edit', saved: '' }]);
      result.current.setSelectedFile('/a.hl');
    });
    await waitFor(() => expect(stored().open).toEqual(['/a.hl']));
    expect(stored()).toEqual({
      open: ['/a.hl'],
      selected: '/a.hl',
      expanded: ['/etc/'],
      sys: true,
    });
    expect(localStorage.getItem(KEY)).not.toContain('secret edit');
  });
});
