import { useState } from 'react';
import { showToast } from '../../../lib/toast';

/*
 * Wizard granting email. Send pairs [mail.smtp.send] with [mime.create] to compose the
 * message; Receive pairs [mail.pop3.fetch] with [mime.parse] to read one.
 */
export default function EmailWizard(
  props: Readonly<{ onAdd: (lines: string[]) => void; onCancel: () => void }>,
) {
  const [send, setSend] = useState(true);
  const [receive, setReceive] = useState(false);

  function add() {
    const lines: string[] = [];
    if (send) {
      lines.push('mail.smtp.send', 'mime.create');
    }
    if (receive) {
      lines.push('mail.pop3.fetch', 'mime.parse');
    }
    if (lines.length === 0) {
      showToast('Tick Send or Receive', true);
      return;
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Email</div>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          title="Send mail through the configured SMTP server"
        >
          <input type="checkbox" checked={send} onChange={e => setSend(e.target.checked)} />
          Send
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          title="Fetch mail over POP3"
        >
          <input type="checkbox" checked={receive} onChange={e => setReceive(e.target.checked)} />
          Receive
        </label>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>
          Add
        </button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>
          Close
        </button>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        Send uses the server&apos;s configured SMTP account; recipients are set per call.
      </span>
    </div>
  );
}
