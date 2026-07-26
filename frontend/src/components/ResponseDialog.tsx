/*
 * The result of invoking an endpoint: status, timing, response headers and
 * the body. Shared so that invoking from the Endpoints list and invoking the
 * open file in Hyper IDE look and behave identically.
 */

import { useState } from 'react';
import { Modal } from './Dialogs';
import ResultViewer from './ResultViewer';
import { InvokeResult } from './InvokePanel';
import { loadBackend } from '../lib/backend';

/*
 * Whether the dashboard and the backend are on different origins. When they
 * are, the browser hands JavaScript only the CORS-safelisted response headers
 * unless the backend sends Access-Control-Expose-Headers — so the header list
 * is a subset of what the server actually sent, and says so.
 */
function isCrossOrigin() {
  const url = loadBackend()?.url;
  if (!url) {
    return false;
  }
  return new URL(url).origin !== window.location.origin;
}

export default function ResponseDialog(props: {
  result: InvokeResult;
  onClose: () => void;
  // Only a real HTTP invocation has headers worth qualifying.
  httpInvocation?: boolean;
}) {

  const { result, onClose } = props;

  return (
    <Modal width={860} onClose={onClose}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 0 }}>
        Response
        <span className={'badge ' + (result.status < 400 ? 'badge-get' : 'badge-error')}>
          {result.status}
        </span>
        <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
          {result.elapsed} ms
        </span>
      </h2>
      <ResponseHeaders headers={result.headers} />
      {props.httpInvocation && isCrossOrigin() && (
        <p className="muted" style={{ fontSize: 12, margin: '0 0 8px 0' }}>
          The dashboard and this backend are on different domains, so the
          browser only exposes some of the response headers — the server may
          have sent more.
        </p>
      )}
      <ResultViewer result={result} height="42vh" />
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

/*
 * The response headers the server sent. Collapsed to a single line by
 * default, since the body is what's usually wanted — but CORS, caching and
 * content-type problems are only diagnosable from here.
 */
function ResponseHeaders({ headers }: { headers?: Record<string, string> }) {

  const [open, setOpen] = useState(false);

  const names = Object.keys(headers ?? {}).sort();
  if (names.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        className="btn btn-small btn-secondary"
        onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show'} response headers ({names.length})
      </button>
      {open && (
        <div
          className="mono"
          style={{
            marginTop: 8,
            maxHeight: '20vh',
            overflow: 'auto',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '8px 12px',
            fontSize: 12,
          }}>
          {names.map(name => (
            <div key={name} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{name}:</span>
              <span style={{ overflowWrap: 'anywhere' }}>{headers![name]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
