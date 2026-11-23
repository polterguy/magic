// @vitest-environment jsdom
/*
 * useWorkspace: the remembered workspace is read once from localStorage under a per-backend
 * key, and anything unreadable falls back to an empty workspace.
 */
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useWorkspace } from '../hooks/useWorkspace';

beforeEach(() => {
  localStorage.clear();
});

describe('useWorkspace', () => {
  it('keys the workspace by backend url', () => {
    const { result } = renderHook(() => useWorkspace('https://a.test'));
    expect(result.current.workspaceKey).toBe('magic2.ide.workspace.https://a.test');
  });

  it('uses an empty suffix when there is no backend', () => {
    const { result } = renderHook(() => useWorkspace(undefined));
    expect(result.current.workspaceKey).toBe('magic2.ide.workspace.');
  });

  it('reads the stored workspace for that backend only', () => {
    const stored = { open: ['/a.hl'], selected: '/a.hl', expanded: ['/'], sys: true };
    localStorage.setItem('magic2.ide.workspace.https://a.test', JSON.stringify(stored));
    localStorage.setItem(
      'magic2.ide.workspace.https://b.test',
      JSON.stringify({ open: ['/b.hl'] }),
    );
    const { result } = renderHook(() => useWorkspace('https://a.test'));
    expect(result.current.workspace).toEqual(stored);
  });

  it('is empty when nothing is stored', () => {
    const { result } = renderHook(() => useWorkspace('https://a.test'));
    expect(result.current.workspace).toEqual({});
  });

  it('is empty when the stored value is not valid JSON', () => {
    localStorage.setItem('magic2.ide.workspace.https://a.test', '{not json');
    const { result } = renderHook(() => useWorkspace('https://a.test'));
    expect(result.current.workspace).toEqual({});
  });

  it('reads only once, so later storage changes do not replace the workspace', () => {
    localStorage.setItem('magic2.ide.workspace.x', JSON.stringify({ selected: '/one' }));
    const { result, rerender } = renderHook(() => useWorkspace('x'));
    localStorage.setItem('magic2.ide.workspace.x', JSON.stringify({ selected: '/two' }));
    rerender();
    expect(result.current.workspace.selected).toBe('/one');
  });
});
