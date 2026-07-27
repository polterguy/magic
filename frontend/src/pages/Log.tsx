import { showToast } from '../lib/toast';
import SearchInput from '../components/SearchInput';
import { useCallback, useEffect, useState } from 'react';
import { LogItem, countLog, listLog } from '../lib/api';

const PAGE_SIZE = 20;

export default function Log() {

  const [items, setItems] = useState<LogItem[]>([]);
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  // Stack of "from" ids used to page backwards through the log.
  const [fromStack, setFromStack] = useState<number[]>([]);

  const load = useCallback(async (from: number | null, filter: string) => {
    try {
      const [logItems, logCount] = await Promise.all([
        listLog(from, PAGE_SIZE, filter || undefined),
        countLog(filter || undefined),
      ]);
      setItems(logItems ?? []);
      setCount(logCount.count);
    } catch (err: any) {
      showToast(err.message, true);
    }
  }, []);

  useEffect(() => {
    load(null, query);
    setFromStack([]);
  }, [load, query]);

  function nextPage() {
    if (items.length === 0) {
      return;
    }
    const last = items[items.length - 1].id;
    setFromStack([...fromStack, last]);
    load(last, query);
  }

  function previousPage() {
    const stack = [...fromStack];
    stack.pop();
    setFromStack(stack);
    load(stack.length > 0 ? stack[stack.length - 1] : null, query);
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
          disabled={fromStack.length === 0}
          onClick={previousPage}>
          ‹ Newer
        </button>
        <button
          className="btn btn-secondary btn-small"
          disabled={items.length < PAGE_SIZE}
          onClick={nextPage}>
          Older ›
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 170 }}>When</th>
              <th style={{ width: 80 }}>Type</th>
              <th>Content</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <LogRow
                key={item.id}
                item={item}
                expanded={expanded === item.id}
                onToggle={() => setExpanded(expanded === item.id ? null : item.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LogRow(props: { item: LogItem; expanded: boolean; onToggle: () => void }) {

  const { item } = props;
  return (
    <>
      <tr className="clickable" onClick={props.onToggle}>
        <td className="mono" data-label="When">{new Date(item.created).toLocaleString()}</td>
        <td data-label="Type">
          <span className={'badge badge-' + item.type.toLowerCase()}>{item.type}</span>
        </td>
        <td data-label="Content">{item.content}</td>
      </tr>
      {props.expanded && item.exception && (
        <tr>
          <td colSpan={3}>
            <pre className="result-json">{item.exception}</pre>
          </td>
        </tr>
      )}
    </>
  );
}
