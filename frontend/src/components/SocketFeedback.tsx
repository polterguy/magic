/*
 * Streams server feedback over SignalR while a long-running backend job
 * (vectorise, crawl, import) executes. The job is started by the caller with
 * a feedback-channel name; every message published on that channel renders
 * as a line in this modal.
 */

import Banner from './Banner';
import { useEffect, useRef, useState } from 'react';
import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { backendInfo } from '../lib/api';
import { Modal } from './Dialogs';

interface FeedbackMessage {
  type: string;
  message: string;
}

export default function SocketFeedback(props: {
  title: string;
  channel: string;
  // Invoked once the socket listens — the caller starts the backend job here.
  onReady: () => void;
  onClose: () => void;
}) {

  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const readyFired = useRef(false);

  useEffect(() => {
    const backend = backendInfo();
    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(backend.url + '/sockets', {
        accessTokenFactory: () => backend.token ?? '',
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .build();

    connection.on(props.channel, (args: string) => {
      const parsed = JSON.parse(args);
      setMessages(current => [...current, {
        type: parsed.type ?? 'information',
        message: parsed.message ?? args,
      }]);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
    });

    /*
     * StrictMode mounts effects twice, so the first connection is stopped
     * while it is still negotiating - which rejects its start() with "Failed
     * to start the HttpConnection before stop() was called". That belongs to
     * a connection nobody is using any more, so a torn down run is not
     * allowed to report anything.
     */
    let cancelled = false;

    connection.start()
      .then(() => {
        if (cancelled) {
          return;
        }
        if (!readyFired.current) {
          readyFired.current = true;
          props.onReady();
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(String(err));
        }
      });

    return () => {
      cancelled = true;
      // Stopping mid-negotiation rejects; nothing is listening either way.
      connection.stop().catch(() => {});
    };
  }, [props.channel]);

  return (
    <Modal width={760} onClose={props.onClose}>
      <h2 style={{ marginTop: 0 }}>{props.title}</h2>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <div className="terminal">
        <div className="terminal-bar">
          <span className="terminal-title">{props.channel}</span>
        </div>
        <div ref={listRef} className="terminal-body">
          {messages.length === 0
            ? <div className="terminal-line waiting">Waiting for your server…</div>
            : messages.map((message, index) => (
              <div key={index} className={'terminal-line ' + message.type}>
                {message.message}
              </div>
            ))}
          <span className="terminal-caret" />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
