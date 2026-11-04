import { copyToClipboard } from '../lib/toast';
import { showError } from '../lib/errors';
import { CopyIcon } from '../components/Icons';
import SearchInput from '../components/SearchInput';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogItem, countLog, listLog } from '../lib/api';
import { TableSkeleton } from '../components/Skeleton';
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

function LogRow(
  props: Readonly<{
    item: LogItem;
    // The entry a deep link pointed at, marked so the visitor can spot it.
    highlighted: boolean;
    expanded: boolean;
    onToggle: () => void;
  }>,
) {
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
        onKeyDown={
          canExpand
            ? event => {
                if (
                  event.target === event.currentTarget &&
                  (event.key === 'Enter' || event.key === ' ')
                ) {
                  event.preventDefault();
                  props.onToggle();
                }
              }
            : undefined
        }
      >
        <td className="mono" data-label="When">
          {timeAgo(item.created)}
        </td>
        <td className="mono muted" data-label="Timestamp">
          {isoDate(item.created)}
        </td>
        <td data-label="Type">
          <span className={'badge badge-' + item.type.toLowerCase()}>{item.type}</span>
        </td>
        <td data-label="Content">{item.content}</td>
        <td className="log-caret-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          {meta.length > 0 && (
            <span
              className="log-meta-pill"
              title={meta.length + ' meta value' + (meta.length === 1 ? '' : 's')}
            >
              {meta.length}
            </span>
          )}
          {canExpand && <span className="log-caret">{props.expanded ? '▾' : '▸'}</span>}
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
              <div style={{ position: 'relative' }}>
                <button
                  className="icon-btn"
                  title="Copy exception"
                  style={{ position: 'absolute', top: 6, right: 6 }}
                  onClick={() => copyToClipboard(item.exception!, 'Exception')}
                >
                  <CopyIcon />
                </button>
                <pre
                  className="result-json"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingRight: 44 }}
                >
                  {item.exception}
                </pre>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
