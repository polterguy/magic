/*
 * Generates a personalised system instruction from a "templated template"
 * (a DYNAMIC flavor whose text contains [[...]] placeholders). The user
 * supplies a URL; the backend crawls it, fills the placeholders using the
 * flavor's instruction, and streams the result back over a socket.
 */

import Banner from './Banner';
import { useRef, useState } from 'react';
import { createSocket } from '../lib/socket';
import { Modal, useDialog } from './Dialogs';
import { createSystemMessage, gibberish } from '../lib/api';

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
  const { confirm } = useDialog();

  async function generate() {
    if (!url) {
      return;
    }
    setBusy(true);
    setError('');

    // Channel names come from the server's random-string endpoint, like every
    // other socket consumer — a timestamp is guessable and can collide.
    let channel: string;
    try {
      channel = 'c_' + (await gibberish()).result;
    } catch (err: any) {
      setBusy(false);
      setError(err?.message ?? 'Could not create a feedback channel');
      return;
    }
    const connection = createSocket();
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

  /*
   * The crawl takes minutes and shouldn't be dismissed by a stray Escape —
   * but a user must never be trapped if the answer never arrives, so leaving
   * mid-generation is allowed after a confirmation. The crawl itself carries
   * on server-side either way; only the result is lost.
   */
  async function close() {
    if (busy && !await confirm({
      title: 'Stop waiting?',
      message: 'The generation continues on the server, but its result will be lost.',
      confirmText: 'Stop waiting',
      danger: true,
    })) {
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
          {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
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
