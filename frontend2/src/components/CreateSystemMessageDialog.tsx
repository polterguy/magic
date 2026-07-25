/*
 * Generates a personalised system instruction from a "templated template"
 * (a DYNAMIC flavor whose text contains [[...]] placeholders). The user
 * supplies a URL; the backend crawls it, fills the placeholders using the
 * flavor's instruction, and streams the result back over a socket.
 */

import { useRef, useState } from 'react';
import { HttpTransportType, HubConnectionBuilder } from '@microsoft/signalr';
import { Modal } from './Dialogs';
import { backendInfo, createSystemMessage } from '../lib/api';

export default function CreateSystemMessageDialog(props: {
  instruction: string;
  template: string;
  onGenerated: (message: string) => void;
  onClose: () => void;
}) {

  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const connectionRef = useRef<any>(null);

  function generate() {
    if (!url) {
      return;
    }
    setBusy(true);
    setError('');

    const backend = backendInfo();
    const channel = 'c_' + new Date().toISOString();
    const connection = new HubConnectionBuilder()
      .withUrl(backend.url + '/sockets', {
        accessTokenFactory: () => backend.token ?? '',
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .build();
    connectionRef.current = connection;

    connection.on(channel, (raw: string) => {
      const args = JSON.parse(raw);
      connection.stop();
      setBusy(false);
      if (args.message === 'ERROR') {
        setError(args.extra ?? 'Generation failed');
        return;
      }
      props.onGenerated(args.message);
    });

    connection.start()
      .then(() => createSystemMessage(props.instruction, props.template, url, channel))
      .catch((err: any) => {
        setBusy(false);
        setError(err?.message ?? 'Could not connect to socket');
        connection.stop();
      });
  }

  function close() {
    // Don't allow closing (Escape / backdrop / Cancel) while a generation is
    // in flight — the crawl can take minutes and must not be interrupted.
    if (busy) {
      return;
    }
    connectionRef.current?.stop();
    props.onClose();
  }

  return (
    <Modal width={560} onClose={close}>
      <h2>Generate system instruction</h2>
      {busy ? (
        <div className="spinner-panel">
          <div className="spinner" />
          <div>
            <div style={{ fontWeight: 600 }}>
              Generating from {url}<span className="spinner-dots" />
            </div>
            <div className="muted" style={{ marginTop: 4 }}>
              This can take a minute or two. Please keep this window open.
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            This template builds a personalised instruction from a website. Enter a
            URL — the server will crawl it and fill in the template. This takes a
            minute or two; keep this window open.
          </p>
          {error && <div className="error-box" style={{ marginBottom: 10 }}>{error}</div>}
          <label className="modal-label">
            Website URL
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              autoFocus
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') generate(); }} />
          </label>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={close}>Cancel</button>
            <button className="btn" onClick={generate} disabled={!url}>Generate</button>
          </div>
        </>
      )}
    </Modal>
  );
}
