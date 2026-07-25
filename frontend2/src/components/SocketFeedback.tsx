/*
 * Streams server feedback over SignalR while a long-running backend job
 * (vectorise, crawl, import) executes. The job is started by the caller with
 * a feedback-channel name; every message published on that channel renders
 * as a line in this modal.
 */

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

    connection.start()
      .then(() => {
        if (!readyFired.current) {
          readyFired.current = true;
          props.onReady();
        }
      })
      .catch(err => setError(String(err)));

    return () => {
      connection.stop();
    };
  }, [props.channel]);

  return (
    <Modal width={700} onClose={props.onClose}>
      <h2>{props.title}</h2>
      {error && <div className="error-box" style={{ marginBottom: 10 }}>{error}</div>}
      <div
        ref={listRef}
        className="result-json"
        style={{
          height: '45vh',
          overflow: 'auto',
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 12,
          whiteSpace: 'pre-wrap',
        }}>
        {messages.length === 0
          ? 'Waiting for feedback from your server…'
          : messages.map((message, index) => (
            <div
              key={index}
              style={{
                color: message.type === 'error' ? '#ff8a8a'
                  : message.type === 'success' ? '#7be0a2'
                  : undefined,
              }}>
              {message.message}
            </div>
          ))}
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
