import { useEffect, useMemo, useState } from 'react';
import { Endpoint, listEndpoints } from '../lib/api';

export default function Endpoints() {

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listEndpoints()
      .then(setEndpoints)
      .catch(err => setError(err.message));
  }, []);

  const visible = useMemo(() => {
    const query = filter.toLowerCase();
    return endpoints.filter(endpoint =>
      !query ||
      endpoint.path.toLowerCase().includes(query) ||
      endpoint.verb.toLowerCase().includes(query));
  }, [endpoints, filter]);

  return (
    <>
      <div className="page-header">
        <h1>Endpoints</h1>
        <p>{endpoints.length} endpoints on your server</p>
      </div>
      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Filter endpoints…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ width: 320 }} />
        <span className="muted">{visible.length} shown</span>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Verb</th>
              <th>Path</th>
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
                  onToggle={() => setExpanded(expanded === key ? null : key)} />
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function EndpointRow(props: { endpoint: Endpoint; expanded: boolean; onToggle: () => void }) {

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
            {endpoint.description && <p style={{ marginTop: 0 }}>{endpoint.description}</p>}
            <div className="muted">
              Consumes: {endpoint.consumes ?? 'n/a'} — Produces: {endpoint.produces ?? 'n/a'}
            </div>
            {endpoint.input && endpoint.input.length > 0 && (
              <table style={{ marginTop: 10, background: 'transparent' }}>
                <thead>
                  <tr><th>Argument</th><th>Type</th></tr>
                </thead>
                <tbody>
                  {endpoint.input.map(argument => (
                    <tr key={argument.name}>
                      <td className="mono">{argument.name}</td>
                      <td className="mono">{argument.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
