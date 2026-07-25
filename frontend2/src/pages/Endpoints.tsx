import { useEffect, useMemo, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import { Modal } from '../components/Dialogs';
import SortHeader, { useSort } from '../components/SortHeader';
import ResultViewer, { RawResult } from '../components/ResultViewer';
import { Endpoint, invokeEndpoint, listEndpoints } from '../lib/api';

/*
 * Builds a sample JSON payload from the endpoint's argument meta, the way
 * the old dashboard does: int-ish → 42, decimal-ish → 5.5, bool → true,
 * date → now, everything else → "foo".
 */
function samplePayload(endpoint: Endpoint) {
  const payload: Record<string, any> = {};
  for (const argument of endpoint.input ?? []) {
    switch (argument.type) {
      case 'int': case 'long': case 'uint': case 'ulong': case 'short': case 'ushort':
        payload[argument.name] = 42;
        break;
      case 'decimal': case 'float': case 'double':
        payload[argument.name] = 5.5;
        break;
      case 'bool':
        payload[argument.name] = true;
        break;
      case 'date':
        payload[argument.name] = new Date().toISOString();
        break;
      default:
        payload[argument.name] = 'foo';
    }
  }
  return JSON.stringify(payload, null, 2);
}

interface InvokeResult extends RawResult {
  elapsed: number;
}

export default function Endpoints() {

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InvokeResult | null>(null);

  useEffect(() => {
    listEndpoints()
      .then(setEndpoints)
      .catch(err => setError(err.message));
  }, []);

  const [sort, setSort] = useSort();

  const visible = useMemo(() => {
    const query = filter.toLowerCase();
    const filtered = endpoints.filter(endpoint =>
      !query ||
      endpoint.path.toLowerCase().includes(query) ||
      endpoint.verb.toLowerCase().includes(query));
    if (!sort.column) {
      return filtered;
    }
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((left: any, right: any) =>
      String(left[sort.column!] ?? '').localeCompare(String(right[sort.column!] ?? '')) * factor);
  }, [endpoints, filter, sort]);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <h1>Endpoints</h1>
          <p>{endpoints.length} endpoints on your server</p>
        </div>
        <span style={{ flex: 1 }} />
        <input
          type="text"
          placeholder="Filter endpoints…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ width: 320 }} />
        <span className="muted">{visible.length} shown</span>
      </div>
      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <SortHeader
                column="verb"
                label="Verb"
                sort={sort}
                onSort={setSort}
                style={{ width: 90 }} />
              <SortHeader column="path" label="Path" sort={sort} onSort={setSort} />
              <th>Auth</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(endpoint => {
              const key = endpoint.verb + ' ' + endpoint.path;
              return (
                <EndpointRow
                  key={key}
                  endpoint={endpoint}
                  expanded={expanded === key}
                  onToggle={() => setExpanded(expanded === key ? null : key)}
                  onResult={setResult} />
              );
            })}
          </tbody>
        </table>
      </div>
      {result !== null && (
        <Modal width={860} onClose={() => setResult(null)}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Response
            <span className={'badge ' + (result.status < 400 ? 'badge-get' : 'badge-error')}>
              {result.status}
            </span>
            <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
              {result.elapsed} ms
            </span>
          </h2>
          <ResultViewer result={result} />
          <div className="modal-actions">
            <button className="btn" onClick={() => setResult(null)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function EndpointRow(props: {
  endpoint: Endpoint;
  expanded: boolean;
  onToggle: () => void;
  onResult: (result: InvokeResult) => void;
}) {

  const { endpoint } = props;
  return (
    <>
      <tr className="clickable" onClick={props.onToggle}>
        <td>
          <span className={'badge badge-' + endpoint.verb.toLowerCase()}>{endpoint.verb}</span>
        </td>
        <td className="mono">{endpoint.path}</td>
        <td>
          {(endpoint.auth ?? []).map(role => <span className="chip" key={role}>{role}</span>)}
        </td>
      </tr>
      {props.expanded && (
        <tr>
          <td colSpan={3} style={{ background: 'var(--accent-soft)' }}>
            <InvokePanel endpoint={endpoint} onResult={props.onResult} />
          </td>
        </tr>
      )}
    </>
  );
}

function InvokePanel(props: {
  endpoint: Endpoint;
  onResult: (result: InvokeResult) => void;
}) {

  const { endpoint } = props;
  const verb = endpoint.verb.toLowerCase();
  const usesQuery = verb === 'get' || verb === 'delete';
  const consumesJson = !endpoint.consumes || endpoint.consumes.includes('json');
  const [args, setArgs] = useState<Record<string, string>>({});
  const [payload, setPayload] = useState(() => samplePayload(endpoint));
  const [busy, setBusy] = useState(false);
  const [invokeError, setInvokeError] = useState('');

  // Socket endpoints and non-JSON payloads beyond text can't be invoked here.
  const canInvoke = verb !== 'socket' &&
    (usesQuery || consumesJson ||
      endpoint.consumes?.includes('hyperlambda') || endpoint.consumes?.startsWith('text/'));

  async function invoke() {
    setBusy(true);
    setInvokeError('');
    try {
      let url = endpoint.path;
      let body: string | undefined = undefined;
      if (usesQuery) {
        const parts: string[] = [];
        for (const argument of endpoint.input ?? []) {
          const value = args[argument.name];
          if (value === undefined || value === '') {
            continue;
          }
          const encoded = argument.type === 'date'
            ? new Date(value).toISOString()
            : value;
          parts.push(encodeURIComponent(argument.name) + '=' + encodeURIComponent(encoded));
        }
        if (parts.length > 0) {
          url += '?' + parts.join('&');
        }
      } else {
        body = payload;
      }
      const response = await invokeEndpoint(
        endpoint.verb, url, body, endpoint.consumes ?? 'application/json');
      props.onResult(response);
    } catch (err: any) {
      setInvokeError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: '6px 0' }}>
      {endpoint.description && <p style={{ marginTop: 0 }}>{endpoint.description}</p>}
      <div className="muted" style={{ marginBottom: 10 }}>
        Consumes: {endpoint.consumes ?? 'n/a'} — Produces: {endpoint.produces ?? 'n/a'}
      </div>
      {invokeError && <div className="error-box" style={{ marginBottom: 10 }}>{invokeError}</div>}
      {usesQuery && (endpoint.input?.length ?? 0) > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 10,
          marginBottom: 12,
        }}>
          {endpoint.input!.map(argument => (
            <label key={argument.name} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              <span>
                {argument.name}
                <span className="muted" style={{ fontWeight: 400 }}> — {argument.type}</span>
              </span>
              <input
                type="text"
                value={args[argument.name] ?? ''}
                onChange={e => setArgs({ ...args, [argument.name]: e.target.value })} />
            </label>
          ))}
        </div>
      )}
      {!usesQuery && (
        <div style={{ height: 200, display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
          <CodeEditor
            value={payload}
            onChange={setPayload}
            mode={consumesJson ? 'application/json' : 'hyperlambda'} />
        </div>
      )}
      {canInvoke ? (
        <button className="btn" onClick={invoke} disabled={busy}>
          {busy ? 'Invoking…' : '▷ Invoke'}
        </button>
      ) : (
        <span className="muted">This endpoint cannot be invoked from here.</span>
      )}
    </div>
  );
}
