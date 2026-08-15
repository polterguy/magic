/*
 * Streams server feedback over SignalR while a long-running backend job
 * (vectorise, crawl, import) executes. The job is started by the caller with
 * a feedback-channel name; every message published on that channel renders
 * as a line in the shared terminal-styled ProgressDialog.
 */

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createSocket } from '../lib/socket';
import ProgressDialog from './ProgressDialog';

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
    // What the job is working through, singular — "snippet", "endpoint".
    noun: string;
  };
}) {

  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [error, setError] = useState('');
  const readyFired = useRef(false);

  useEffect(() => {
    const connection = createSocket();

    connection.on(props.channel, (args: string) => {
      const parsed = JSON.parse(args);
      setMessages(current => [...current, {
        type: parsed.type ?? 'information',
        message: parsed.message ?? args,
      }]);
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
    <ProgressDialog
      title={props.title}
      label={props.channel}
      lines={messages}
      error={error}
      onDismissError={() => setError('')}
      progress={props.progress
        ? 'Processing ' + props.progress.noun + ' ' +
          messages.filter(props.progress.counts).length + ' of ' + props.progress.total
        : undefined}
      actions={props.isComplete && messages.some(props.isComplete)
        ? props.renderDone?.(messages)
        : undefined}
      onClose={props.onClose} />
  );
}
