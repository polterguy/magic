/*
 * The terminal-styled progress modal. SocketFeedback feeds it from a SignalR
 * channel; flows that know their own progress — like the Endpoint Generator's
 * client-side loop — feed it directly, without a socket in between.
 */

import Banner from './Banner';
import { ReactNode, useEffect, useRef } from 'react';
import { Modal } from './Dialogs';

export interface ProgressLine {
  // information | error | warning | success — the terminal-line colours.
  type: string;
  message: string;
}

export default function ProgressDialog(props: {
  title: string;
  // Label in the terminal's title bar — a channel name, a module path.
  label: string;
  lines: ProgressLine[];
  // Right-hand side of the terminal bar, e.g. "Processing 3 of 54".
  progress?: string;
  // Rendered in the action bar next to Close — a follow-up link, a Cancel.
  actions?: ReactNode;
  // Shown above the terminal when the transport itself failed.
  error?: string;
  onDismissError?: () => void;
  waitingText?: string;
  onClose: () => void;
}) {

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [props.lines.length]);

  return (
    <Modal width={760} onClose={props.onClose}>
      <h2 style={{ marginTop: 0 }}>{props.title}</h2>
      {props.error && (
        <Banner onClose={() => props.onDismissError?.()} style={{ marginBottom: 10 }}>
          {props.error}
        </Banner>
      )}
      <div className="terminal">
        <div className="terminal-bar">
          <span className="terminal-title">{props.label}</span>
          {props.progress && (
            <span className="terminal-progress">{props.progress}</span>
          )}
        </div>
        <div ref={listRef} className="terminal-body">
          {props.lines.length === 0
            ? <div className="terminal-line waiting">
                {props.waitingText ?? 'Waiting for your server…'}
              </div>
            : props.lines.map((line, index) => (
              <div key={index} className={'terminal-line ' + line.type}>
                {line.message}
              </div>
            ))}
          <span className="terminal-caret" />
        </div>
      </div>
      <div className="modal-actions">
        {props.actions}
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
