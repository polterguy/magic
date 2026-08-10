/*
 * Server-paged list state shared by every filterable table in the dashboard.
 * Owns the page, debounces the filter, and lets only the newest response
 * paint — two keystrokes in quick succession fire two requests, and without
 * a guard whichever answers LAST wins, stale or not.
 */

import { useEffect, useRef, useState } from 'react';
import { showToast } from './toast';

/*
 * The value, trailing its source by delayMs. The initial render passes
 * through immediately, so first loads don't sit waiting on a timer.
 */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export interface PagedList<T> {
  /*
   * Null until the first response lands — a table still loading and a table
   * with no rows are different things, and each deserves its own rendering.
   */
  rows: T[] | null;
  count: number;
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
  loading: boolean;
  refresh: () => void;
}

export function usePagedList<T>(options: {
  /*
   * Fetches one page plus the total matching the current filter. Closes over
   * whatever filter/sort state the page keeps — list that state in `filter`
   * and `deps` so the hook knows when to refetch.
   */
  load: (offset: number, limit: number) => Promise<{ rows: T[]; count: number }>;
  pageSize: number;
  // The debounced dependency — the search string being typed.
  filter?: unknown;
  // Immediate dependencies — sort state, the active tab, and so on.
  deps?: unknown[];
}): PagedList<T> {

  const [rows, setRows] = useState<T[] | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const loadRef = useRef(options.load);
  loadRef.current = options.load;

  const filter = useDebounced(options.filter);
  const key = JSON.stringify([filter, ...(options.deps ?? [])]);
  const lastKey = useRef(key);
  const seq = useRef(0);

  useEffect(() => {
    // A changed filter or sort starts over from the first page.
    if (lastKey.current !== key) {
      lastKey.current = key;
      if (page !== 0) {
        setPage(0);
        return;
      }
    }
    const current = ++seq.current;
    setLoading(true);
    loadRef.current(page * options.pageSize, options.pageSize)
      .then(result => {
        if (current !== seq.current) {
          return;
        }
        setRows(result.rows ?? []);
        setCount(result.count);
      })
      .catch(err => {
        if (current === seq.current) {
          showToast(err.message, true);
        }
      })
      .finally(() => {
        if (current === seq.current) {
          setLoading(false);
        }
      });
  }, [key, page, tick, options.pageSize]);

  return {
    rows,
    count,
    page,
    pageCount: Math.ceil(count / options.pageSize),
    setPage,
    loading,
    refresh: () => setTick(current => current + 1),
  };
}
