import { useState } from 'react';

import { changePassword, MIN_PASSWORD } from '../../lib/api';
import { showError } from '../../lib/errors';
import { showToast } from '../../lib/toast';
import BusyLabel from '../BusyLabel';
import { Modal } from '../Dialogs';

/*
 * Opens by itself after a magic-link sign-in: the user just arrived through
 * an emailed one-shot link, so they have no password they know. Dismissable —
 * the next emailed link works just as well.
 */
export default function SetPasswordDialog(props: Readonly<{ onClose: () => void }>) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (password.length < MIN_PASSWORD) {
      showToast('Passwords must be at least ' + MIN_PASSWORD + ' characters', true);
      return;
    }
    setBusy(true);
    try {
      await changePassword(password);
      showToast('Your password is set');
      props.onClose();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={460}
      onClose={props.onClose}
      onSubmit={() => {
        if (!busy && password) void save();
      }}
    >
      <h2>Set your password</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        You signed in through an emailed link, which only works once. Set a password so you can sign
        in normally next time.
      </p>
      <div className="form-grid">
        <label>
          New password (min {MIN_PASSWORD} characters)
          <input
            type="password"
            data-initial-focus
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Not now
        </button>
        <button className="btn" onClick={save} disabled={busy || password.length < MIN_PASSWORD}>
          <BusyLabel busy={busy} label="Set password" busyLabel="Saving…" />
        </button>
      </div>
    </Modal>
  );
}
