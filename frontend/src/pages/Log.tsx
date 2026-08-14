import { showToast } from '../lib/toast';
import SearchInput from '../components/SearchInput';
import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LogItem, countLog, listLog } from '../lib/api';
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
  // Disables the pagers while a page is in flight, so rapid clicks can't
  // push several "from" ids and race their responses.
  const [loading, setLoading] = useState(false);
  // Only the newest request may paint — typing fires one per (debounced)
  // change, and whichever answers last would win otherwise.
  const seq = useRef(0);
  const debouncedQuery = useDebounced(query);
  // The entry a ?id= deep link pointed at, marked in the list.
  const [highlight, setHighlight] = useState<number | null>(null);

  const load = useCallback(async (from: number | null, filter: string) => {
    const current = ++seq.current;
    setLoading(true);
    try {
      const [logItems, logCount] = await Promise.all([
        listLog(from, PAGE_SIZE, filter || undefined),
        countLog(filter || undefined),
      ]);
      if (current !== seq.current) {
        return;
      }
      setItems(logItems ?? []);
      setCount(logCount.count);
    } catch (err: any) {
      if (current === seq.current) {
        showToast(err.message, true, err.logId);
      }
    } finally {
      if (current === seq.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load(null, debouncedQuery);
    setFromStack([]);
  }, [load, debouncedQuery]);

  /*
   * ?id= deep links — error toasts link here with the id of the log entry
   * behind the error. Paging starts just above that id so the entry is the
   * top row, and "‹ Newer" walks back to the head of the log. Consumed
   * once, and declared after the initial load so this request wins.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const target = searchParams.get('id');
    if (target !== null) {
      const from = Number(target) + 1;
      setFromStack([from]);
      setHighlight(Number(target));
      load(from, '');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, load]);

  // Deep-linked entries open expanded — the details are what you came for.
  useEffect(() => {
    if (highlight === null || items === null) {
      return;
    }
    const hit = items.find(item => Number(item.id) === highlight);
    if (hit && (hit.exception || hit.meta)) {
      setExpanded(hit.id);
    }
  }, [items, highlight]);

  function nextPage() {
    if (!items || items.length === 0) {
      return;
    }
    const last = items[items.length - 1].id;
    setFromStack([...fromStack, last]);
    load(last, debouncedQuery);
  }

  function previousPage() {
    const stack = [...fromStack];
    stack.pop();
    setFromStack(stack);
    load(stack.length > 0 ? stack[stack.length - 1] : null, debouncedQuery);
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
          style={{ width: 320 }} />
        <span className="spacer" />
        <button
          className="btn btn-secondary btn-small"
          disabled={fromStack.length === 0 || loading}
          onClick={previousPage}>
          ‹ Newer
        </button>
        <button
          className="btn btn-secondary btn-small"
          disabled={(items ?? []).length < PAGE_SIZE || loading}
          onClick={nextPage}>
          Older ›
        </button>
      </div>
      {items === null ? (
        <div className="spinner-panel">
          <div className="spinner" />
          <span className="muted">Loading log…</span>
        </div>
      ) : (
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
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
                onToggle={() => setExpanded(expanded === item.id ? null : item.id)} />
            ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}

/* "11 seconds ago", "3 minutes ago", … up through years. */
function timeAgo(created: string): string {
  const diff = Math.max(0, Date.now() - new Date(created).getTime());
  const s = Math.round(diff / 1000);
  const fmt = (n: number, unit: string) => n + ' ' + unit + (n === 1 ? '' : 's') + ' ago';
  if (s < 60) return fmt(s, 'second');
  const m = Math.round(s / 60);
  if (m < 60) return fmt(m, 'minute');
  const h = Math.round(m / 60);
  if (h < 24) return fmt(h, 'hour');
  const d = Math.round(h / 24);
  if (d < 7) return fmt(d, 'day');
  const w = Math.round(d / 7);
  if (w < 5) return fmt(w, 'week');
  const mo = Math.round(d / 30);
  if (mo < 12) return fmt(mo, 'month');
  return fmt(Math.round(d / 365), 'year');
}

/* Exact time as ISO 8601 (UTC), milliseconds trimmed. */
function isoDate(created: string): string {
  return new Date(created).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function LogRow(props: {
  item: LogItem;
  // The entry a deep link pointed at, marked so the visitor can spot it.
  highlighted: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {

  const { item } = props;
  const meta = Object.entries(item.meta ?? {});
  // Rows carrying a stack trace and/or meta information have something to reveal.
  const canExpand = !!item.exception || meta.length > 0;
  return (
    <>
      <tr
        className={(canExpand ? 'clickable' : '') + (props.highlighted ? ' log-target' : '')}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? props.expanded : undefined}
        onClick={canExpand ? props.onToggle : undefined}
        onKeyDown={canExpand ? event => {
          if (event.target === event.currentTarget &&
              (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            props.onToggle();
          }
        } : undefined}>
        <td className="mono" data-label="When">{timeAgo(item.created)}</td>
        <td className="mono muted" data-label="Timestamp">{isoDate(item.created)}</td>
        <td data-label="Type">
          <span className={'badge badge-' + item.type.toLowerCase()}>{item.type}</span>
        </td>
        <td data-label="Content">{item.content}</td>
        <td className="log-caret-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          {meta.length > 0 && (
            <span
              className="log-meta-pill"
              title={meta.length + ' meta value' + (meta.length === 1 ? '' : 's')}>
              {meta.length}
            </span>
          )}
          {canExpand && (
            <span className="log-caret">{props.expanded ? '▾' : '▸'}</span>
          )}
        </td>
      </tr>
      {props.expanded && (
        <tr>
          <td colSpan={5}>
            {meta.length > 0 && (
              <div className="log-meta">
                {meta.map(([key, value]) => (
                  <div key={key} className="log-meta-row">
                    <span className="log-meta-key mono">{key}</span>
                    <span className="log-meta-value">{value}</span>
                  </div>
                ))}
              </div>
            )}
            {item.exception && (
              <pre className="result-json">{item.exception}</pre>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
