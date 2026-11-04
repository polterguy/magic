// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api';
import { setToastListener } from '../toast';
import { useDebounced, usePagedList } from '../usePagedList';

type Page = { rows: string[]; count: number };

// A load whose calls each hand back a promise the test settles by hand.
function deferredLoad() {
  const calls: {
    offset: number;
    limit: number;
    resolve: (page: Page) => void;
    reject: (err: unknown) => void;
  }[] = [];
  const load = vi.fn(
    (offset: number, limit: number) =>
      new Promise<Page>((resolve, reject) => calls.push({ offset, limit, resolve, reject })),
  );
  return { load, calls };
}

// Lets settled promises and the state updates they trigger run.
async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  setToastListener(null);
});

describe('useDebounced', () => {
  it('passes the initial value through and trails later changes', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounced(value, 300), {
      initialProps: { value: 'a' },
    });
    expect(result.current).toBe('a');
    rerender({ value: 'ab' });
    await flush(299);
    expect(result.current).toBe('a');
    await flush(1);
    expect(result.current).toBe('ab');
  });
});

describe('usePagedList', () => {
  it('loads the first page and reports loading until it lands', async () => {
    const { load, calls } = deferredLoad();
    const { result } = renderHook(() => usePagedList({ load, pageSize: 10 }));
    expect(load).toHaveBeenCalledWith(0, 10);
    expect(result.current.rows).toBeNull();
    expect(result.current.loading).toBe(true);

    calls[0].resolve({ rows: ['a', 'b'], count: 25 });
    await flush();
    expect(result.current.rows).toEqual(['a', 'b']);
    expect(result.current.count).toBe(25);
    expect(result.current.pageCount).toBe(3);
    expect(result.current.loading).toBe(false);
  });

  it('fetches the requested page at the right offset', async () => {
    const { load, calls } = deferredLoad();
    const { result } = renderHook(() => usePagedList({ load, pageSize: 10 }));
    calls[0].resolve({ rows: [], count: 25 });
    await flush();

    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
    expect(result.current.loading).toBe(true);
    expect(load).toHaveBeenLastCalledWith(20, 10);
  });

  it('refetches the same page on refresh', async () => {
    const { load, calls } = deferredLoad();
    const { result } = renderHook(() => usePagedList({ load, pageSize: 5 }));
    calls[0].resolve({ rows: ['a'], count: 1 });
    await flush();

    act(() => result.current.refresh());
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenLastCalledWith(0, 5);
    expect(result.current.loading).toBe(true);
    // Rows from the previous load stay up while the refresh is in flight.
    expect(result.current.rows).toEqual(['a']);
  });

  it('debounces a filter change, then starts over from page 0', async () => {
    const { load, calls } = deferredLoad();
    const { result, rerender } = renderHook(
      ({ filter }) => usePagedList({ load, pageSize: 10, filter }),
      { initialProps: { filter: '' } },
    );
    calls[0].resolve({ rows: [], count: 50 });
    await flush();
    act(() => result.current.setPage(3));
    expect(load).toHaveBeenLastCalledWith(30, 10);
    const before = load.mock.calls.length;

    rerender({ filter: 'x' });
    rerender({ filter: 'xy' });
    await flush(299);
    expect(load).toHaveBeenCalledTimes(before);
    expect(result.current.page).toBe(3);

    await flush(1);
    expect(result.current.page).toBe(0);
    expect(load).toHaveBeenCalledTimes(before + 1);
    expect(load).toHaveBeenLastCalledWith(0, 10);
  });

  it('refetches immediately when a dep changes', async () => {
    const { load, calls } = deferredLoad();
    const { result, rerender } = renderHook(
      ({ sort }) => usePagedList({ load, pageSize: 10, deps: [sort] }),
      { initialProps: { sort: 'name' } },
    );
    calls[0].resolve({ rows: [], count: 50 });
    await flush();
    act(() => result.current.setPage(1));

    rerender({ sort: 'created' });
    expect(result.current.page).toBe(0);
    expect(load).toHaveBeenLastCalledWith(0, 10);
  });

  it('uses the newest load function without refetching for it', async () => {
    const first = deferredLoad();
    const second = deferredLoad();
    const { result, rerender } = renderHook(({ load }) => usePagedList({ load, pageSize: 10 }), {
      initialProps: { load: first.load },
    });
    first.calls[0].resolve({ rows: [], count: 0 });
    await flush();

    rerender({ load: second.load });
    expect(second.load).not.toHaveBeenCalled();
    act(() => result.current.refresh());
    expect(second.load).toHaveBeenCalledTimes(1);
    expect(first.load).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale response that lands after a newer one', async () => {
    const { load, calls } = deferredLoad();
    const { result } = renderHook(() => usePagedList({ load, pageSize: 10 }));
    act(() => result.current.setPage(1));
    expect(calls).toHaveLength(2);

    calls[1].resolve({ rows: ['page 1'], count: 20 });
    await flush();
    calls[0].resolve({ rows: ['page 0'], count: 99 });
    await flush();
    expect(result.current.rows).toEqual(['page 1']);
    expect(result.current.count).toBe(20);
    expect(result.current.loading).toBe(false);
  });

  it('stays loading while only a stale request has settled', async () => {
    const { load, calls } = deferredLoad();
    const { result } = renderHook(() => usePagedList({ load, pageSize: 10 }));
    act(() => result.current.setPage(1));

    calls[0].resolve({ rows: ['page 0'], count: 20 });
    await flush();
    expect(result.current.rows).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('treats missing rows in a response as an empty list', async () => {
    const { load, calls } = deferredLoad();
    const { result } = renderHook(() => usePagedList({ load, pageSize: 10 }));
    calls[0].resolve({ count: 0 } as unknown as Page);
    await flush();
    expect(result.current.rows).toEqual([]);
  });

  it('shows a failed load as an error toast and stops loading', async () => {
    const listener = vi.fn();
    setToastListener(listener);
    const { load, calls } = deferredLoad();
    const { result } = renderHook(() => usePagedList({ load, pageSize: 10 }));

    calls[0].reject(new ApiError(500, 'Boom', 7));
    await flush();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Boom', isError: true, logId: 7 }),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toBeNull();
  });

  it('does not toast for a stale failure', async () => {
    const listener = vi.fn();
    setToastListener(listener);
    const { load, calls } = deferredLoad();
    const { result } = renderHook(() => usePagedList({ load, pageSize: 10 }));
    act(() => result.current.setPage(1));

    calls[0].reject(new Error('stale'));
    await flush();
    expect(listener).not.toHaveBeenCalled();
  });
});
