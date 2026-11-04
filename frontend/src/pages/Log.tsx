import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import LogRow from '../components/log/LogRow';
import SearchInput from '../components/SearchInput';
import { TableSkeleton } from '../components/Skeleton';
import { countLog, listLog, LogItem } from '../lib/api';
import { showError } from '../lib/errors';
import { useDebounced } from '../lib/usePagedList';

const PAGE_SIZE = 20;

export default function Log() {
  // Null until the first response, so loading and "no items" look different.
  const [items, setItems] = useState<LogItem[] | null>(null);
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  // Stack of "from" ids used to page backwards through the log.
  const [fromStack, setFromStack] = useState<number[]>([]);
  const debouncedQuery = useDebounced(query);
  // The entry a ?id= deep link pointed at, marked in the list.
  const [highlight, setHighlight] = useState<number | null>(null);
  // Bumped by a deep link, so following one reloads even when it lands on the page already shown.
  const [linkTick, setLinkTick] = useState(0);

  // A changed filter starts over from the head of the log.
  const [stackQuery, setStackQuery] = useState(debouncedQuery);
  if (stackQuery !== debouncedQuery) {
    setStackQuery(debouncedQuery);
    setFromStack([]);
  }

  /*
   * ?id= deep links — error toasts link here with the id of the log entry
   * behind the error. Paging starts just above that id so the entry is the
   * top row, and "‹ Newer" walks back to the head of the log. Consumed
   * once: the parameter is dropped from the URL right after.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const target = searchParams.get('id');
  const [linkedTarget, setLinkedTarget] = useState<string | null>(null);
  if (linkedTarget !== target) {
    setLinkedTarget(target);
    if (target !== null) {
      setFromStack([Number(target) + 1]);
      setHighlight(Number(target));
      setLinkTick(tick => tick + 1);
    }
  }
  useEffect(() => {
    if (target !== null) {
      setSearchParams({}, { replace: true });
    }
  }, [target, setSearchParams]);

  /*
   * The page shown is derived from the paging stack and the filter. Loading is
   * derived too: the pagers are disabled until the request for the current page
   * has settled, so rapid clicks can't push several "from" ids and race their
   * responses. Only the newest request may paint — typing fires one per
   * (debounced) change, and whichever answers last would win otherwise.
   */
  const from = fromStack.at(-1) ?? null;
  const filter = debouncedQuery;
  const requestKey = JSON.stringify([from, filter, linkTick]);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const loading = settledKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    Promise.all([listLog(from, PAGE_SIZE, filter || undefined), countLog(filter || undefined)])
      .then(([logItems, logCount]) => {
        if (cancelled) {
          return;
        }
        setItems(logItems ?? []);
        setCount(logCount.count);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          showError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSettledKey(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, from, filter]);

  // Deep-linked entries open expanded — the details are what you came for.
  const [expandedFor, setExpandedFor] = useState<{
    items: LogItem[] | null;
    highlight: number | null;
  }>({ items: null, highlight: null });
  if (expandedFor.items !== items || expandedFor.highlight !== highlight) {
    setExpandedFor({ items, highlight });
    const hit =
      highlight === null || items === null
        ? undefined
        : items.find(item => Number(item.id) === highlight);
    if (hit && (hit.exception || hit.meta)) {
      setExpanded(hit.id);
    }
  }

  function nextPage() {
    if (!items || items.length === 0) {
      return;
    }
    const last = items[items.length - 1].id;
    setFromStack([...fromStack, last]);
  }

  function previousPage() {
    const stack = [...fromStack];
    stack.pop();
    setFromStack(stack);
  }

  return (
    <>
      <div className="page-header">
        <h1>Log</h1>
        <p>{count} log items</p>
      </div>
      <div className="toolbar">
        <SearchInput
          placeholder="Filter log…"
          value={query}
          onChange={setQuery}
          style={{ width: 320 }}
        />
        <span className="spacer" />
        <button
          className="btn btn-secondary btn-small"
          disabled={fromStack.length === 0 || loading}
          onClick={previousPage}
        >
          ‹ Newer
        </button>
        <button
          className="btn btn-secondary btn-small"
          disabled={(items ?? []).length < PAGE_SIZE || loading}
          onClick={nextPage}
        >
          Older ›
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {items === null ? (
          <TableSkeleton columns={5} />
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 150 }}>When</th>
                <th style={{ width: 200 }}>Timestamp</th>
                <th style={{ width: 80 }}>Type</th>
                <th>Content</th>
                <th style={{ width: 36 }} aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    {query ? 'No log items match your filter' : 'The log is empty'}
                  </td>
                </tr>
              )}
              {items.map(item => (
                <LogRow
                  key={item.id}
                  item={item}
                  highlighted={Number(item.id) === highlight}
                  expanded={expanded === item.id}
                  onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
