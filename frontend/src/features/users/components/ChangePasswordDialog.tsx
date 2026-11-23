import { changeUserPassword, MIN_PASSWORD, User } from '@core/api';
import { showError } from '@core/errors';
import { showToast } from '@core/toast';
import BusyLabel from '@shared/ui/BusyLabel';
import { Modal } from '@shared/ui/Dialogs';
import { useState } from 'react';

export default function ChangePasswordDialog(
  props: Readonly<{
    user: User;
    onClose: () => void;
    onSaved: () => void;
  }>,
) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (password.length < MIN_PASSWORD) {
      showToast('Passwords must be at least ' + MIN_PASSWORD + ' characters', true);
      return;
    }
    setBusy(true);
    try {
      await changeUserPassword(props.user.username, password);
      props.onSaved();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      size="sm"
      onClose={props.onClose}
      onSubmit={() => {
        if (!busy && password) void save();
      }}
      title={'Change password for ' + props.user.username}
      actions={
        <>
          <button className="btn btn-secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save} disabled={busy || !password}>
            <BusyLabel busy={busy} label="Change password" busyLabel="Saving…" />
          </button>
        </>
      }
    >
      <label className="modal-label">
        New password (min {MIN_PASSWORD} characters)
        <input
          type="text"
          data-initial-focus
          // Someone else's password, so it is masked with CSS rather than
          // being a password field the browser offers to save as yours.
          className="secret"
          autoComplete="off"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </label>
    </Modal>
  );
}
