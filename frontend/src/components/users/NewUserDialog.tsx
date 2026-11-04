import { useState } from 'react';

import { addUserExtra, addUserToRole, createUser, MIN_PASSWORD, Role } from '../../lib/api';
import { showError } from '../../lib/errors';
import { showToast } from '../../lib/toast';
import { Modal } from '../Dialogs';
import RolesField from './RolesField';

export default function NewUserDialog(
  props: Readonly<{
    roles: Role[];
    onClose: () => void;
    onCreated: (username: string) => void;
  }>,
) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (password.length < MIN_PASSWORD) {
      showToast('Passwords must be at least ' + MIN_PASSWORD + ' characters', true);
      return;
    }
    setBusy(true);
    try {
      await createUser(username, password);
      // Optional details are stored as extra fields on the new user.
      if (name) {
        await addUserExtra(username, 'name', name);
      }
      if (email) {
        await addUserExtra(username, 'email', email);
      }
      for (const role of selectedRoles) {
        await addUserToRole(username, role);
      }
      props.onCreated(username);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={520}
      onClose={props.onClose}
      onSubmit={() => {
        if (!busy && username && password) void save();
      }}
    >
      <h2>New user</h2>
      <div className="form-grid">
        <label>
          Username
          <input
            type="text"
            autoFocus
            autoComplete="off"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password (min {MIN_PASSWORD} characters)
          <input
            type="text"
            // Someone else's password, so it is masked with CSS rather than
            // being a password field the browser offers to save as yours.
            className="secret"
            autoComplete="off"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </label>
        <label>
          Full name (optional)
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label>
          Email (optional)
          <input type="text" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <RolesField roles={props.roles} selected={selectedRoles} onChange={setSelectedRoles} />
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={busy || !username || !password}>
          {busy ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </Modal>
  );
}
