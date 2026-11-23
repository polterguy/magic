// @vitest-environment jsdom
/*
 * useSqlHistory: the session-scoped log of executed statements, newest first, persisted in
 * sessionStorage.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HISTORY_KEY, HISTORY_LIMIT } from '../history';
import { useSqlHistory } from '../hooks/useSqlHistory';

const setSql = vi.fn();
const bumpSqlEditId = vi.fn();

function stored() {
  return JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]') as { sql: string }[];
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('useSqlHistory', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useSqlHistory(setSql, bumpSqlEditId));

    expect(result.current.history).toEqual([]);
  });

  it('restores what an earlier visit stored', () => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify([{ sql: 'select 1', when: 'x' }]));

    const { result } = renderHook(() => useSqlHistory(setSql, bumpSqlEditId));

    expect(result.current.history).toEqual([{ sql: 'select 1', when: 'x' }]);
  });

  it('starts empty when the stored history is unreadable', () => {
    sessionStorage.setItem(HISTORY_KEY, '{not json');

    const { result } = renderHook(() => useSqlHistory(setSql, bumpSqlEditId));

    expect(result.current.history).toEqual([]);
  });

  it('pushes newest first, moves a re-run to the top and stores it', () => {
    const { result } = renderHook(() => useSqlHistory(setSql, bumpSqlEditId));

    act(() => result.current.pushHistory('select 1'));
    act(() => result.current.pushHistory('select 2'));
    act(() => result.current.pushHistory('select 1'));

    expect(result.current.history.map(entry => entry.sql)).toEqual(['select 1', 'select 2']);
    expect(stored().map(entry => entry.sql)).toEqual(['select 1', 'select 2']);
    expect(result.current.history[0].when).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('keeps only the most recent statements', () => {
    const { result } = renderHook(() => useSqlHistory(setSql, bumpSqlEditId));

    for (let i = 0; i < HISTORY_LIMIT + 5; i++) {
      act(() => result.current.pushHistory('select ' + i));
    }

    expect(result.current.history).toHaveLength(HISTORY_LIMIT);
    expect(result.current.history[0].sql).toBe('select ' + (HISTORY_LIMIT + 4));
  });

  it('loads an entry into the editor without asking', () => {
    const { result } = renderHook(() => useSqlHistory(setSql, bumpSqlEditId));
    act(() => result.current.pushHistory('select 1'));
    act(() => result.current.pushHistory('select 2'));

    act(() => result.current.openHistory(1));

    expect(setSql).toHaveBeenCalledWith('select 1');
    expect(bumpSqlEditId).toHaveBeenCalledTimes(1);
  });

  it('ignores an index that is not in the history', () => {
    const { result } = renderHook(() => useSqlHistory(setSql, bumpSqlEditId));

    act(() => result.current.openHistory(3));

    expect(setSql).not.toHaveBeenCalled();
    expect(bumpSqlEditId).not.toHaveBeenCalled();
  });
});
