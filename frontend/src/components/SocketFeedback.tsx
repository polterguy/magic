/*
 * Streams server feedback over SignalR while a long-running backend job
 * (vectorise, crawl, import) executes. The job is started by the caller with
 * a feedback-channel name; every message published on that channel renders
 * as a line in this modal.
 */

import Banner from './Banner';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { createSocket } from '../lib/socket';
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
  // Marks the terminal message (e.g. the "Done!" line). Once one arrives,
  // `renderDone` is shown in the action bar — used for a follow-up link.
  isComplete?: (message: FeedbackMessage) => boolean;
  renderDone?: (messages: FeedbackMessage[]) => ReactNode;
  /*
   * Turns the terminal bar into a progress readout. `total` is how many items
   * the job will work through, and `counts` picks out the one message the job
   * emits per item — the vectoriser announces every snippet it embeds, so
   * counting those tells us how far it has come.
   */
  progress?: {
    total: number;
    counts: (message: FeedbackMessage) => boolean;
  };
}) {

  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const readyFired = useRef(false);

  useEffect(() => {
    const connection = createSocket();

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
          {props.progress && (
            <span className="terminal-progress">
              Processing snippet {messages.filter(props.progress.counts).length} of {props.progress.total}
            </span>
          )}
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
        {props.isComplete && messages.some(props.isComplete) && props.renderDone?.(messages)}
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
